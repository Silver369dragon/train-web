import os
import re

import mysql.connector
import pytest
from dotenv import load_dotenv

from app import create_app


load_dotenv()


@pytest.fixture(scope="session")
def app():
    test_db_name = os.getenv("TEST_DB_NAME", "")
    development_db_name = os.getenv("DB_NAME", "train_web_414411040")

    if not re.fullmatch(r"[A-Za-z0-9_]+_test", test_db_name):
        pytest.fail(
            "拒絕執行測試：TEST_DB_NAME 必須是只含英數字與底線且以 _test 結尾的資料庫名稱。"
        )
    if test_db_name == development_db_name:
        pytest.fail("拒絕執行測試：測試資料庫不可與開發資料庫相同。")

    test_app = create_app({"TESTING": True, "DB_NAME": test_db_name})
    try:
        with test_app.app_context():
            connection = mysql.connector.connect(
                host=test_app.config["DB_HOST"],
                port=int(test_app.config["DB_PORT"]),
                database=test_db_name,
                user=test_app.config["DB_USER"],
                password=test_app.config["DB_PASSWORD"],
                charset="utf8mb4",
                use_unicode=True,
            )
            cursor = connection.cursor()
            cursor.execute("SELECT DATABASE()")
            connected_database = cursor.fetchone()[0]
            cursor.execute(
                "SELECT COUNT(*) FROM information_schema.tables "
                "WHERE table_schema = DATABASE() AND table_name = 'projects'"
            )
            projects_table_exists = cursor.fetchone()[0] == 1
            cursor.close()
            connection.close()
            if connected_database != test_db_name:
                pytest.fail("拒絕執行測試：MySQL 實際連線的資料庫名稱與測試設定不符。")
            if not projects_table_exists:
                pytest.fail(
                    f"測試資料庫 {test_db_name} 缺少 projects 表，請先在 Workbench 執行 schema.sql。"
                )
    except mysql.connector.Error as error:
        pytest.fail(f"無法連線到獨立測試資料庫 {test_db_name}：{error}")

    return test_app


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture(autouse=True)
def clear_only_test_database(app):
    """Each test starts empty; this guard never targets the development DB."""
    if not app.config["DB_NAME"].endswith("_test"):
        pytest.fail("拒絕清理資料：目前連線設定不是 _test 資料庫。")

    with app.app_context():
        from app import get_db_connection

        connection = get_db_connection()
        try:
            cursor = connection.cursor()
            cursor.execute("SELECT DATABASE()")
            if cursor.fetchone()[0] != app.config["DB_NAME"]:
                pytest.fail("拒絕清理資料：MySQL 實際連線不是指定的測試資料庫。")
            cursor.execute("DELETE FROM projects")
            connection.commit()
            cursor.close()
        finally:
            connection.close()
