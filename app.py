import os
import re
from flask import Flask, request, jsonify, render_template, send_from_directory
import pymysql
from pymysql.cursors import DictCursor
from dotenv import load_dotenv

# 載入 .env 環境變數
load_dotenv()

app = Flask(__name__, static_folder='static', template_folder='.')

# 取得資料庫連線函式
def get_db_connection():
    return pymysql.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        port=int(os.getenv('DB_PORT', 3306)),
        user=os.getenv('DB_USER', 'dev_user'),
        password=os.getenv('DB_PASSWORD', ''),
        database=os.getenv('DB_NAME', 'train_db'),
        charset='utf8mb4',
        cursorclass=DictCursor,
        autocommit=False  # 關閉自動提交，手動掌控交易 (Transaction)
    )

# 驗證輸入資料的工具函式
def validate_project_data(data):
    title = (data.get('title') or '').strip()
    description = (data.get('description') or '').strip()
    tech_stack = (data.get('tech_stack') or '').strip()
    status = (data.get('status') or '').strip()
    link_url = (data.get('link_url') or '').strip()

    # 1. 名稱驗證（必填，去除空白後 1~80 字）
    if not title or len(title) > 80:
        return False, "作品名稱為必填，且長度須在 1 至 80 字之間。"

    # 2. 介紹驗證（選填，最多 500 字）
    if len(description) > 500:
        return False, "作品介紹最多 500 字。"

    # 3. 技術驗證（選填，最多 100 字）
    if len(tech_stack) > 100:
        return False, "使用技術最多 100 字。"

    # 4. 狀態驗證（必填，只能是「進行中」或「已完成」）
    if status not in ['進行中', '已完成']:
        return False, "作品狀態只能是「進行中」或「已完成」。"

    # 5. 網址驗證（選填，須為有效的 http 或 https 網址）
    if link_url:
        url_pattern = re.compile(r'^https?://.+')
        if not url_pattern.match(link_url):
            return False, "作品連結必須是以 http:// 或 https:// 開頭的有效網址。"
    else:
        link_url = None

    cleaned_data = {
        'title': title,
        'description': description if description else None,
        'tech_stack': tech_stack if tech_stack else None,
        'status': status,
        'link_url': link_url
    }
    return True, cleaned_data

# ==================== 前端靜態頁面路由 ====================
@app.route('/')
def index():
    # 提供首頁
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    # 支援讀取 styles.css、members 等靜態檔案
    return send_from_directory('.', path)

# ==================== RESTful API 路由 ====================

# 1. GET /api/projects：取得所有作品
@app.route('/api/projects', methods=['GET'])
def get_projects():
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            # 依建立時間倒序排序，讓最新的作品排在前面
            sql = "SELECT id, title, description, tech_stack, status, link_url, created_at FROM projects ORDER BY created_at DESC, id DESC;"
            cursor.execute(sql)
            projects = cursor.fetchall()

            # 轉換 datetime 物件為字串
            for p in projects:
                if p.get('created_at'):
                    p['created_at'] = p['created_at'].strftime('%Y-%m-%d %H:%M:%S')

            return jsonify({"status": "success", "data": projects}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": f"資料庫查詢失敗: {str(e)}"}), 500
    finally:
        if conn:
            conn.close()

# 2. POST /api/projects：新增作品
@app.route('/api/projects', methods=['POST'])
def create_project():
    data = request.get_json() or {}
    is_valid, result = validate_project_data(data)
    if not is_valid:
        return jsonify({"status": "fail", "message": result}), 400

    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            # 參數化查詢，防止 SQL Injection
            sql = """
                INSERT INTO projects (title, description, tech_stack, status, link_url)
                VALUES (%s, %s, %s, %s, %s);
            """
            cursor.execute(sql, (
                result['title'],
                result['description'],
                result['tech_stack'],
                result['status'],
                result['link_url']
            ))
            new_id = cursor.lastrowid

        # 交易保護：成功執行則 commit
        conn.commit()
        return jsonify({
            "status": "success",
            "message": "作品新增成功",
            "data": {"id": new_id, **result}
        }), 201

    except Exception as e:
        # 交易保護：出錯立即 rollback 回滾
        if conn:
            conn.rollback()
        return jsonify({"status": "error", "message": f"新增失敗: {str(e)}"}), 500
    finally:
        if conn:
            conn.close()

# 3. PUT /api/projects/<id>：修改指定作品
@app.route('/api/projects/<int:project_id>', methods=['PUT'])
def update_project(project_id):
    data = request.get_json() or {}
    is_valid, result = validate_project_data(data)
    if not is_valid:
        return jsonify({"status": "fail", "message": result}), 400

    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            # 先檢查該作品是否存在
            check_sql = "SELECT id FROM projects WHERE id = %s;"
            cursor.execute(check_sql, (project_id,))
            if not cursor.fetchone():
                return jsonify({"status": "fail", "message": "找不到該筆作品，無法修改"}), 404

            # 執行更新
            update_sql = """
                UPDATE projects
                SET title = %s, description = %s, tech_stack = %s, status = %s, link_url = %s
                WHERE id = %s;
            """
            cursor.execute(update_sql, (
                result['title'],
                result['description'],
                result['tech_stack'],
                result['status'],
                result['link_url'],
                project_id
            ))

        conn.commit()
        return jsonify({
            "status": "success",
            "message": "作品修改成功",
            "data": {"id": project_id, **result}
        }), 200

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"status": "error", "message": f"修改失敗: {str(e)}"}), 500
    finally:
        if conn:
            conn.close()

# 4. DELETE /api/projects/<id>：刪除指定作品
@app.route('/api/projects/<int:project_id>', methods=['DELETE'])
def delete_project(project_id):
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            # 檢查是否存在
            check_sql = "SELECT id, title FROM projects WHERE id = %s;"
            cursor.execute(check_sql, (project_id,))
            target = cursor.fetchone()
            if not target:
                return jsonify({"status": "fail", "message": "找不到該筆作品，無法刪除"}), 404

            # 執行刪除
            delete_sql = "DELETE FROM projects WHERE id = %s;"
            cursor.execute(delete_sql, (project_id,))

        conn.commit()
        return jsonify({
            "status": "success",
            "message": f"作品「{target['title']}」已成功刪除"
        }), 200

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"status": "error", "message": f"刪除失敗: {str(e)}"}), 500
    finally:
        if conn:
            conn.close()

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='127.0.0.1', port=port, debug=True)