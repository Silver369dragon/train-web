"""Flask app for the student project journal."""

import logging
import os
from pathlib import Path
from urllib.parse import urlsplit

import mysql.connector
from dotenv import load_dotenv
from flask import Flask, current_app, jsonify, request, send_from_directory


ROOT = Path(__file__).resolve().parent
ALLOWED_STATUSES = {"進行中", "已完成"}


def create_app(test_config=None):
    load_dotenv()
    app = Flask(__name__, static_folder=None)
    app.config.from_mapping(
        DB_HOST=os.getenv("DB_HOST", "127.0.0.1"),
        DB_PORT=os.getenv("DB_PORT", "3306"),
        DB_NAME=os.getenv("DB_NAME", "train_web_414411040"),
        DB_USER=os.getenv("DB_USER", "train_web_414411040_app"),
        DB_PASSWORD=os.getenv("DB_PASSWORD", ""),
    )
    if test_config:
        app.config.update(test_config)

    @app.get("/")
    @app.get("/index.html")
    def home():
        return send_from_directory(ROOT, "index.html")

    @app.get("/styles.css")
    def site_styles():
        return send_from_directory(ROOT, "styles.css")

    @app.get("/assets/<path:filename>")
    def assets(filename):
        return send_from_directory(ROOT / "assets", filename)

    @app.get("/members/<path:filename>")
    def members(filename):
        return send_from_directory(ROOT / "members", filename)

    @app.get("/api/projects")
    def list_projects():
        connection = None
        try:
            connection = get_db_connection()
            cursor = connection.cursor(dictionary=True)
            cursor.execute(
                "SELECT id, name, description, technologies, status, url "
                "FROM projects ORDER BY id DESC"
            )
            projects = cursor.fetchall()
            cursor.close()
            return jsonify(projects)
        except mysql.connector.Error:
            app.logger.exception("Could not read projects from MySQL")
            return database_error()
        finally:
            close_connection(connection)

    @app.post("/api/projects")
    def create_project():
        payload = request.get_json(silent=True)
        project, errors = validate_project(payload)
        if errors:
            return validation_error(errors)

        connection = None
        try:
            connection = get_db_connection()
            connection.start_transaction()
            cursor = connection.cursor(dictionary=True)
            cursor.execute(
                """INSERT INTO projects (name, description, technologies, status, url)
                   VALUES (%s, %s, %s, %s, %s)""",
                (
                    project["name"],
                    project["description"],
                    project["technologies"],
                    project["status"],
                    project["url"],
                ),
            )
            project_id = cursor.lastrowid
            cursor.execute(
                "SELECT id, name, description, technologies, status, url "
                "FROM projects WHERE id = %s",
                (project_id,),
            )
            created = cursor.fetchone()
            connection.commit()
            cursor.close()
            return jsonify(created), 201
        except mysql.connector.Error:
            rollback_connection(connection)
            app.logger.exception("Could not create project in MySQL")
            return database_error()
        finally:
            close_connection(connection)

    @app.put("/api/projects/<int:project_id>")
    def update_project(project_id):
        payload = request.get_json(silent=True)
        project, errors = validate_project(payload)
        if errors:
            return validation_error(errors)

        connection = None
        try:
            connection = get_db_connection()
            connection.start_transaction()
            cursor = connection.cursor(dictionary=True)
            cursor.execute("SELECT id FROM projects WHERE id = %s FOR UPDATE", (project_id,))
            if cursor.fetchone() is None:
                connection.rollback()
                cursor.close()
                return api_error("找不到指定作品。", 404)

            cursor.execute(
                """UPDATE projects
                   SET name = %s, description = %s, technologies = %s, status = %s, url = %s
                   WHERE id = %s""",
                (
                    project["name"],
                    project["description"],
                    project["technologies"],
                    project["status"],
                    project["url"],
                    project_id,
                ),
            )
            cursor.execute(
                "SELECT id, name, description, technologies, status, url "
                "FROM projects WHERE id = %s",
                (project_id,),
            )
            updated = cursor.fetchone()
            connection.commit()
            cursor.close()
            return jsonify(updated)
        except mysql.connector.Error:
            rollback_connection(connection)
            app.logger.exception("Could not update project in MySQL")
            return database_error()
        finally:
            close_connection(connection)

    @app.delete("/api/projects/<int:project_id>")
    def delete_project(project_id):
        connection = None
        try:
            connection = get_db_connection()
            connection.start_transaction()
            cursor = connection.cursor(dictionary=True)
            cursor.execute("SELECT id FROM projects WHERE id = %s FOR UPDATE", (project_id,))
            if cursor.fetchone() is None:
                connection.rollback()
                cursor.close()
                return api_error("找不到指定作品。", 404)

            cursor.execute("DELETE FROM projects WHERE id = %s", (project_id,))
            connection.commit()
            cursor.close()
            return "", 204
        except mysql.connector.Error:
            rollback_connection(connection)
            app.logger.exception("Could not delete project from MySQL")
            return database_error()
        finally:
            close_connection(connection)

    @app.errorhandler(404)
    def not_found(error):
        if request.path.startswith("/api/"):
            return api_error("找不到指定資源。", 404)
        return error

    return app


def get_db_connection():
    return mysql.connector.connect(
        host=current_app.config["DB_HOST"],
        port=int(current_app.config["DB_PORT"]),
        database=current_app.config["DB_NAME"],
        user=current_app.config["DB_USER"],
        password=current_app.config["DB_PASSWORD"],
        charset="utf8mb4",
        use_unicode=True,
    )


def validate_project(payload):
    if not isinstance(payload, dict):
        return None, {"_form": "請以 JSON 物件提供作品資料。"}

    errors = {}
    name = payload.get("name")
    if not isinstance(name, str) or not name.strip():
        errors["name"] = "請輸入作品名稱。"
    elif len(name.strip()) > 80:
        errors["name"] = "作品名稱最多 80 字。"

    optional_fields = {
        "description": (500, "作品介紹最多 500 字。"),
        "technologies": (100, "使用技術最多 100 字。"),
        "url": (None, "作品連結必須是有效的 http 或 https 網址。"),
    }
    values = {}
    for field, (limit, message) in optional_fields.items():
        value = payload.get(field, "")
        if not isinstance(value, str):
            errors[field] = f"{field} 必須是文字。"
            continue
        value = value.strip()
        if limit is not None and len(value) > limit:
            errors[field] = message
        elif field == "url" and value and not is_valid_url(value):
            errors[field] = message
        values[field] = value

    status = payload.get("status")
    if not isinstance(status, str) or status not in ALLOWED_STATUSES:
        errors["status"] = "作品狀態只能是「進行中」或「已完成」。"

    if errors:
        return None, errors

    return {
        "name": name.strip(),
        **values,
        "status": status,
    }, {}


def is_valid_url(value):
    if any(character.isspace() for character in value):
        return False
    try:
        parsed = urlsplit(value)
        port = parsed.port
        return (
            parsed.scheme.lower() in {"http", "https"}
            and bool(parsed.hostname)
            and (port is None or 1 <= port <= 65535)
        )
    except ValueError:
        return False


def validation_error(errors):
    return jsonify({"error": "資料驗證失敗，請檢查輸入內容。", "fields": errors}), 400


def api_error(message, status):
    return jsonify({"error": message}), status


def database_error():
    return api_error("目前無法連線或儲存資料，請稍後再試。", 503)


def rollback_connection(connection):
    if connection is not None and connection.is_connected():
        connection.rollback()


def close_connection(connection):
    if connection is not None and connection.is_connected():
        connection.close()


app = create_app()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    app.run(host="127.0.0.1", port=5000)
