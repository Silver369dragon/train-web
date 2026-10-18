import pytest
import os
import sys
import pymysql

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app import app, get_db_connection


@pytest.fixture(autouse=True)
def setup_test_db():
    """在每個測試執行前，重置獨立的測試資料庫 train_web_test"""
    app.config["TESTING"] = True
    conn = get_db_connection(use_test_db=True)
    with conn.cursor() as cursor:
        cursor.execute("DELETE FROM projects")
        cursor.execute("ALTER TABLE projects AUTO_INCREMENT = 1")
    conn.commit()
    conn.close()
    yield
    # 測試後關閉連線


@pytest.fixture
def client():
    """提供 Flask 測試用戶端"""
    with app.test_client() as client:
        yield client


def test_get_projects_empty(client):
    """測試一開始作品清單為空"""
    res = client.get("/api/projects")
    assert res.status_code == 200
    assert res.get_json() == []


def test_create_and_retrieve_project(client):
    """測試新增作品後能成功查回資料"""
    payload = {
        "name": "個人作品集",
        "description": "展示個人網頁作品的網站",
        "technologies": "HTML, CSS, Flask",
        "status": "in_progress",
        "url": "https://github.com/example/portfolio"
    }
    res = client.post("/api/projects", json=payload)
    assert res.status_code == 201
    created = res.get_json()
    assert created["id"] is not None
    assert created["name"] == "個人作品集"
    assert created["status"] == "in_progress"

    # 查回清單
    list_res = client.get("/api/projects")
    assert list_res.status_code == 200
    items = list_res.get_json()
    assert len(items) == 1
    assert items[0]["name"] == "個人作品集"


def test_reject_invalid_name(client):
    """測試空白名稱會被拒絕（400），且不會寫入資料庫"""
    payload = {
        "name": "   ",
        "description": "沒有名稱的作品",
        "status": "in_progress"
    }
    res = client.post("/api/projects", json=payload)
    assert res.status_code == 400
    assert "error" in res.get_json()

    # 確認資料庫沒有新增任何資料
    list_res = client.get("/api/projects")
    assert len(list_res.get_json()) == 0


def test_reject_invalid_status_and_url(client):
    """測試不合法的狀態與格式錯誤的 URL 會被拒絕（400）"""
    # 不合法狀態
    res1 = client.post("/api/projects", json={
        "name": "測試作品",
        "status": "not_a_valid_status"
    })
    assert res1.status_code == 400

    # 格式錯誤的 URL
    res2 = client.post("/api/projects", json={
        "name": "測試作品",
        "status": "completed",
        "url": "ftp://not-http-url.com"
    })
    assert res2.status_code == 400


def test_update_project_and_isolation(client):
    """測試修改指定作品，不影響另一筆作品，且保留原 ID"""
    # 建立兩筆作品
    res1 = client.post("/api/projects", json={"name": "作品A", "status": "in_progress"})
    res2 = client.post("/api/projects", json={"name": "作品B", "status": "completed"})
    id1 = res1.get_json()["id"]
    id2 = res2.get_json()["id"]

    # 修改作品 A
    update_res = client.put(f"/api/projects/{id1}", json={
        "name": "作品A（已修改）",
        "status": "completed",
        "description": "新介紹"
    })
    assert update_res.status_code == 200
    updated = update_res.get_json()
    assert updated["id"] == id1
    assert updated["name"] == "作品A（已修改）"
    assert updated["status"] == "completed"

    # 確認作品 B 保持不變
    list_res = client.get("/api/projects")
    items = {item["id"]: item for item in list_res.get_json()}
    assert items[id2]["name"] == "作品B"
    assert items[id2]["status"] == "completed"


def test_delete_project_and_isolation(client):
    """測試刪除指定作品，不影響另一筆作品"""
    res1 = client.post("/api/projects", json={"name": "待刪除作品", "status": "in_progress"})
    res2 = client.post("/api/projects", json={"name": "保留作品", "status": "completed"})
    id1 = res1.get_json()["id"]
    id2 = res2.get_json()["id"]

    del_res = client.delete(f"/api/projects/{id1}")
    assert del_res.status_code == 200

    list_res = client.get("/api/projects")
    items = list_res.get_json()
    assert len(items) == 1
    assert items[0]["id"] == id2
    assert items[0]["name"] == "保留作品"


def test_nonexistent_id_returns_404(client):
    """測試操作不存在的 ID 回傳 404"""
    put_res = client.put("/api/projects/99999", json={"name": "不存在", "status": "completed"})
    assert put_res.status_code == 404
    assert "error" in put_res.get_json()

    del_res = client.delete("/api/projects/99999")
    assert del_res.status_code == 404
    assert "error" in del_res.get_json()
