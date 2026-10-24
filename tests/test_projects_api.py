import os

import pytest


def valid_project(**updates):
    project = {
        "name": "測試作品",
        "description": "用於測試作品 API。",
        "technologies": "Python、Flask",
        "status": "進行中",
        "url": "https://example.com/project",
    }
    project.update(updates)
    return project


def add_project(client, **updates):
    return client.post("/api/projects", json=valid_project(**updates))


def test_create_project_and_read_it_back(client):
    created = add_project(client, name="  中文作品  ")

    assert created.status_code == 201
    assert created.json["name"] == "中文作品"
    assert isinstance(created.json["id"], int)

    response = client.get("/api/projects")
    assert response.status_code == 200
    assert response.json == [created.json]


@pytest.mark.parametrize(
    "project",
    [
        valid_project(name="   "),
        valid_project(name="名" * 81),
        valid_project(description="介" * 501),
        valid_project(technologies="技" * 101),
        valid_project(status="未知狀態"),
        valid_project(status=[]),
        valid_project(url="javascript:alert(1)"),
        valid_project(url="https://bad host.example"),
    ],
)
def test_invalid_project_is_rejected_without_writing(client, project):
    response = client.post("/api/projects", json=project)

    assert response.status_code == 400
    assert "error" in response.json
    assert client.get("/api/projects").json == []


def test_update_preserves_id_and_does_not_change_another_project(client):
    first = add_project(client, name="第一筆").json
    second = add_project(client, name="第二筆").json

    response = client.put(
        f"/api/projects/{first['id']}",
        json=valid_project(name="修改後的第一筆", status="已完成"),
    )

    assert response.status_code == 200
    assert response.json["id"] == first["id"]
    projects = {project["id"]: project for project in client.get("/api/projects").json}
    assert projects[first["id"]]["name"] == "修改後的第一筆"
    assert projects[second["id"]]["name"] == "第二筆"
    assert len(projects) == 2


def test_delete_removes_only_the_requested_project(client):
    first = add_project(client, name="要刪除").json
    second = add_project(client, name="保留").json

    response = client.delete(f"/api/projects/{first['id']}")

    assert response.status_code == 204
    assert [item["id"] for item in client.get("/api/projects").json] == [second["id"]]


@pytest.mark.parametrize("method", ["put", "delete"])
def test_missing_project_returns_404(client, method):
    response = getattr(client, method)(
        "/api/projects/99999999",
        **({"json": valid_project()} if method == "put" else {}),
    )

    assert response.status_code == 404
    assert "error" in response.json


def test_application_uses_a_separate_mysql_test_database(app):
    test_database = app.config["DB_NAME"]
    development_database = os.getenv("DB_NAME", "train_web_414411040")

    assert test_database.endswith("_test")
    assert test_database != development_database
