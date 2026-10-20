import os
import unittest
import json

# 1. 強制設定環境變數使用「獨立測試資料庫」，避免清空或影響開發庫
os.environ["DB_NAME"] = "train_test_db"

from app import app, get_db_connection


class ProjectApiTestCase(unittest.TestCase):
    def setUp(self):
        """每個測試執行前：初始化 test_client 並清空測試表"""
        app.config["TESTING"] = True
        self.client = app.test_client()

        # 清空測試庫中的 projects 表，確保每次測試都從乾淨狀態開始
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("TRUNCATE TABLE projects;")
        conn.commit()
        conn.close()

    # -------------------------------------------------------------
    # 情境 1：新增成功後能查回資料
    # -------------------------------------------------------------
    def test_01_create_and_get_project_success(self):
        new_project = {
            "title": "測試自動化專案",
            "description": "這是一筆用來測試新增與查詢的作品描述",
            "tech_stack": "Flask, MySQL",
            "status": "進行中",
            "link_url": "https://example.com"
        }

        # 發送 POST 新增作品
        post_res = self.client.post(
            "/api/projects",
            data=json.dumps(new_project),
            content_type="application/json"
        )
        self.assertEqual(post_res.status_code, 201)
        post_json = post_res.get_json()
        self.assertEqual(post_json["status"], "success")
        created_id = post_json["data"]["id"]

        # 發送 GET 查詢所有作品，確認能查回剛才新增的那筆資料
        get_res = self.client.get("/api/projects")
        self.assertEqual(get_res.status_code, 200)
        get_json = get_res.get_json()
        projects = get_json["data"]
        
        # 驗證新增的作品確實存在於列表且內容無誤
        self.assertTrue(any(p["id"] == created_id and p["title"] == "測試自動化專案" for p in projects))

    # -------------------------------------------------------------
    # 情境 2：不合法資料被拒絕，且沒有寫入資料庫
    # -------------------------------------------------------------
    def test_02_invalid_project_rejected_and_not_stored(self):
        invalid_project = {
            "title": "   ",  # 空白名稱（不合法）
            "description": "測試無效資料",
            "tech_stack": "Python",
            "status": "尚未開始",  # 不合法的狀態（只能是「進行中」或「已完成」）
            "link_url": "invalid-url"  # 格式不合法的網址
        }

        # 發送 POST 嘗試新增非法資料
        post_res = self.client.post(
            "/api/projects",
            data=json.dumps(invalid_project),
            content_type="application/json"
        )
        # 後端應回傳 400 拒絕
        self.assertEqual(post_res.status_code, 400)

        # 檢查測試資料庫，確認筆數依然為 0，未寫入任何髒資料
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) AS total FROM projects;")
            result = cursor.fetchone()
            total_count = result["total"]
        conn.close()
        self.assertEqual(total_count, 0)

    # -------------------------------------------------------------
    # 情境 3：修改或刪除指定作品，不影響另一筆作品
    # -------------------------------------------------------------
    def test_03_update_and_delete_specific_project_isolates_others(self):
        # 先建立兩筆獨立作品
        p1 = {"title": "作品一", "status": "進行中"}
        p2 = {"title": "作品二", "status": "已完成"}
        
        res1 = self.client.post("/api/projects", json=p1)
        res2 = self.client.post("/api/projects", json=p2)
        id1 = res1.get_json()["data"]["id"]
        id2 = res2.get_json()["data"]["id"]

        # 1. 僅修改作品一
        update_res = self.client.put(
            f"/api/projects/{id1}",
            json={"title": "作品一已修改", "status": "已完成"}
        )
        self.assertEqual(update_res.status_code, 200)

        # 查詢列表，驗證作品二的標題完全沒被動到
        get_res = self.client.get("/api/projects")
        projects = {p["id"]: p for p in get_res.get_json()["data"]}
        self.assertEqual(projects[id1]["title"], "作品一已修改")
        self.assertEqual(projects[id2]["title"], "作品二")

        # 2. 僅刪除作品一
        delete_res = self.client.delete(f"/api/projects/{id1}")
        self.assertEqual(delete_res.status_code, 200)

        # 驗證作品一已被刪除，但作品二依然正常存在
        get_res_after_delete = self.client.get("/api/projects")
        projects_after = {p["id"]: p for p in get_res_after_delete.get_json()["data"]}
        self.assertNotIn(id1, projects_after)
        self.assertIn(id2, projects_after)

    # -------------------------------------------------------------
    # 情境 4：操作不存在的 ID，回傳 404
    # -------------------------------------------------------------
    def test_04_nonexistent_id_returns_404(self):
        nonexistent_id = 999999

        # 修改不存在的 ID，應回傳 404
        put_res = self.client.put(
            f"/api/projects/{nonexistent_id}",
            json={"title": "不存在的作品", "status": "進行中"}
        )
        self.assertEqual(put_res.status_code, 404)

        # 刪除不存在的 ID，應回傳 404
        del_res = self.client.delete(f"/api/projects/{nonexistent_id}")
        self.assertEqual(del_res.status_code, 404)


if __name__ == "__main__":
    unittest.main()