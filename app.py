import os
import re
from urllib.parse import urlparse
from flask import Flask, request, jsonify, send_from_directory
import pymysql
import pymysql.cursors
from dotenv import load_dotenv

# 載入 .env 環境變數
load_dotenv()

app = Flask(__name__, static_folder=".", static_url_path="")


def get_db_connection(use_test_db=False):
    """建立並回傳 MySQL 資料庫連線"""
    db_name = os.getenv("TEST_DB_NAME", "train_web_test") if use_test_db else os.getenv("DB_NAME", "train_web")
    return pymysql.connect(
        host=os.getenv("DB_HOST", "127.0.0.1"),
        port=int(os.getenv("DB_PORT", 3306)),
        user=os.getenv("DB_USER", "train_user"),
        password=os.getenv("DB_PASSWORD", ""),
        database=db_name,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=False
    )


def validate_project_data(data):
    """
    驗證作品資料：
    - name: 必填，去除前後空白後為 1～80 字
    - description: 選填，最多 500 字
    - technologies: 選填，最多 100 字
    - status: 必填，限 'in_progress' 或 'completed'
    - url: 選填，若有填寫須為合法的 http:// 或 https:// 網址
    """
    if not isinstance(data, dict):
        return False, "資料格式錯誤，請提供 JSON 物件"

    # 1. 驗證名稱
    raw_name = data.get("name")
    if not raw_name or not isinstance(raw_name, str):
        return False, "請輸入作品名稱"
    name = raw_name.strip()
    if len(name) < 1 or len(name) > 80:
        return False, "作品名稱長度須在 1 至 80 字之間"

    # 2. 驗證介紹
    desc = data.get("description", "")
    if desc is None:
        desc = ""
    if not isinstance(desc, str):
        return False, "作品介紹格式錯誤"
    if len(desc) > 500:
        return False, "作品介紹最多 500 字"

    # 3. 驗證使用技術
    tech = data.get("technologies", "")
    if tech is None:
        tech = ""
    if not isinstance(tech, str):
        return False, "使用技術格式錯誤"
    if len(tech) > 100:
        return False, "使用技術最多 100 字"

    # 4. 驗證作品狀態
    status = data.get("status")
    allowed_statuses = {"in_progress", "completed"}
    # 支援繁體中文別名轉換
    if status == "進行中":
        status = "in_progress"
    elif status == "已完成":
        status = "completed"

    if status not in allowed_statuses:
        return False, "作品狀態只能是「進行中」或「已完成」"

    # 5. 驗證作品連結
    url = data.get("url", "")
    if url is None:
        url = ""
    if not isinstance(url, str):
        return False, "作品連結格式錯誤"
    url = url.strip()
    if url:
        if not re.match(r"^https?://", url, re.IGNORECASE) or any(c.isspace() for c in url):
            return False, "作品連結須為有效的 http:// 或 https:// 網址"
        try:
            parsed = urlparse(url)
            if not parsed.netloc:
                return False, "作品連結網址不合法"
        except Exception:
            return False, "作品連結網址解析失敗"

    validated = {
        "name": name,
        "description": desc,
        "technologies": tech,
        "status": status,
        "url": url
    }
    return True, validated


# ─── 靜態頁面路由 ──────────────────────────────────────────────────────────

@app.route("/")
def serve_index():
    """提供團隊首頁"""
    return send_from_directory(".", "index.html")


@app.route("/members/<path:filename>")
def serve_member(filename):
    """提供成員介紹頁面及相關靜態檔案"""
    return send_from_directory("members", filename)


# ─── 作品管理 RESTful API ───────────────────────────────────────────────────

@app.route("/api/projects", methods=["GET"])
def get_projects():
    """取得所有作品清單"""
    conn = None
    try:
        conn = get_db_connection(app.config.get("TESTING", False))
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT id, name, description, technologies, status, url, created_at, updated_at
                FROM projects
                ORDER BY id DESC
            """)
            projects = cursor.fetchall()
            # 將 datetime 格式化為 ISO 字串方便前端使用
            for p in projects:
                if p.get("created_at"):
                    p["created_at"] = p["created_at"].strftime("%Y-%m-%d %H:%M:%S")
                if p.get("updated_at"):
                    p["updated_at"] = p["updated_at"].strftime("%Y-%m-%d %H:%M:%S")
        return jsonify(projects), 200
    except Exception as e:
        return jsonify({"error": f"資料庫查詢失敗: {str(e)}"}), 500
    finally:
        if conn:
            conn.close()


@app.route("/api/projects", methods=["POST"])
def create_project():
    """新增作品"""
    data = request.get_json(silent=True)
    if data is None:
        return jsonify({"error": "請提供 JSON 格式之請求內容"}), 400

    is_valid, result = validate_project_data(data)
    if not is_valid:
        return jsonify({"error": result}), 400

    conn = None
    try:
        conn = get_db_connection(app.config.get("TESTING", False))
        with conn.cursor() as cursor:
            # 參數化 SQL 查詢防範 SQL 注入
            sql = """
                INSERT INTO projects (name, description, technologies, status, url)
                VALUES (%s, %s, %s, %s, %s)
            """
            cursor.execute(sql, (
                result["name"],
                result["description"],
                result["technologies"],
                result["status"],
                result["url"]
            ))
            new_id = cursor.lastrowid
        conn.commit()

        # 查回剛新增的資料
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM projects WHERE id = %s", (new_id,))
            created = cursor.fetchone()
            if created.get("created_at"):
                created["created_at"] = created["created_at"].strftime("%Y-%m-%d %H:%M:%S")
            if created.get("updated_at"):
                created["updated_at"] = created["updated_at"].strftime("%Y-%m-%d %H:%M:%S")

        return jsonify(created), 201
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"error": f"新增作品失敗: {str(e)}"}), 500
    finally:
        if conn:
            conn.close()


@app.route("/api/projects/<int:project_id>", methods=["PUT"])
def update_project(project_id):
    """修改指定作品"""
    data = request.get_json(silent=True)
    if data is None:
        return jsonify({"error": "請提供 JSON 格式之請求內容"}), 400

    is_valid, result = validate_project_data(data)
    if not is_valid:
        return jsonify({"error": result}), 400

    conn = None
    try:
        conn = get_db_connection(app.config.get("TESTING", False))
        with conn.cursor() as cursor:
            # 確認作品是否存在
            cursor.execute("SELECT id FROM projects WHERE id = %s", (project_id,))
            exists = cursor.fetchone()
            if not exists:
                return jsonify({"error": f"找不到 ID 為 {project_id} 的作品"}), 404

            # 參數化更新
            sql = """
                UPDATE projects
                SET name = %s, description = %s, technologies = %s, status = %s, url = %s
                WHERE id = %s
            """
            cursor.execute(sql, (
                result["name"],
                result["description"],
                result["technologies"],
                result["status"],
                result["url"],
                project_id
            ))
        conn.commit()

        # 查回更新後資料
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM projects WHERE id = %s", (project_id,))
            updated = cursor.fetchone()
            if updated.get("created_at"):
                updated["created_at"] = updated["created_at"].strftime("%Y-%m-%d %H:%M:%S")
            if updated.get("updated_at"):
                updated["updated_at"] = updated["updated_at"].strftime("%Y-%m-%d %H:%M:%S")

        return jsonify(updated), 200
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"error": f"修改作品失敗: {str(e)}"}), 500
    finally:
        if conn:
            conn.close()


@app.route("/api/projects/<int:project_id>", methods=["DELETE"])
def delete_project(project_id):
    """刪除指定作品"""
    conn = None
    try:
        conn = get_db_connection(app.config.get("TESTING", False))
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, name FROM projects WHERE id = %s", (project_id,))
            project = cursor.fetchone()
            if not project:
                return jsonify({"error": f"找不到 ID 為 {project_id} 的作品"}), 404

            cursor.execute("DELETE FROM projects WHERE id = %s", (project_id,))
        conn.commit()
        return jsonify({"message": f"作品「{project['name']}」已成功刪除", "id": project_id}), 200
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"error": f"刪除作品失敗: {str(e)}"}), 500
    finally:
        if conn:
            conn.close()


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)

