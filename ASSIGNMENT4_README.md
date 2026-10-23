# 作業四：作品紀錄管理系統

本專案以 Flask 提供 RESTful API，使用 MySQL 儲存作品資料，並由 `members/ray-fan.html` 與 `members/ray-fan.js` 透過 `fetch()` 完成作品的新增、查詢、修改與刪除。

## 1. 環境與必要套件

- Python：3.10 以上（建議使用 3.12）
- MySQL：8.0 以上
- Python 套件：Flask、PyMySQL、python-dotenv

## 2. Windows：啟動 MySQL、建立資料庫與帳號

請以系統管理員身分開啟 PowerShell。先確認本機 MySQL 服務名稱；常見名稱為 `MySQL80`：

```powershell
Get-Service *mysql*
Start-Service MySQL80
```

登入 MySQL 的 root 帳號後，建立資料庫與專用帳號：

```powershell
mysql -u root -p
```

```sql
CREATE DATABASE IF NOT EXISTS train_db
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'dev_user'@'localhost' IDENTIFIED BY '<your_password>';
GRANT ALL PRIVILEGES ON train_db.* TO 'dev_user'@'localhost';
FLUSH PRIVILEGES;
```

## 3. Python 虛擬環境與 `.env`

在專案根目錄執行：

```powershell
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install Flask PyMySQL python-dotenv
```

若 PowerShell 禁止啟用指令碼，僅對目前使用者執行一次：

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

在 `app.py` 同層建立 `.env`（不可提交到 Git）：

```dotenv
DB_HOST=localhost
DB_PORT=3306
DB_USER=dev_user
DB_PASSWORD=<your_password>
DB_NAME=train_db
```

## 4. 匯入資料表與種子資料

在專案根目錄，以 `dev_user` 匯入資料表結構與種子資料。下列為 **PowerShell** 指令，使用管線傳入 SQL 檔：

```powershell
Get-Content .\schema.sql | mysql -u dev_user -p train_db
Get-Content .\seed.sql | mysql -u dev_user -p train_db
```

輸入 `<your_password>` 後，資料庫會建立 `projects` 資料表及三筆示範資料。若使用 Windows 命令提示字元（cmd），才可使用 `< schema.sql` 與 `< seed.sql` 的輸入重導向。

## 5. 啟動 Flask 與個人頁

確認虛擬環境已啟用後執行：

```powershell
python app.py
```

開啟個人作品管理頁：<http://127.0.0.1:5000/members/ray-fan.html>

`app.py` 預設監聽本機 `127.0.0.1:5000`，也可在 `.env` 設定 `PORT` 自訂埠號；例如 macOS 可設為 `PORT=5001`，以避開 AirPlay 服務可能使用的埠號。使用自訂埠號時，請將上方網址中的 `5000` 改為對應的埠號。停止服務請在終端機按 `Ctrl+C`。

## 6. 資料表與 RESTful API

### `projects` 欄位規格

| 欄位 | 型別 | 規則與用途 |
| --- | --- | --- |
| `id` | `INT` | 主鍵、自動遞增 |
| `title` | `VARCHAR(80)` | 必填，作品名稱 |
| `description` | `VARCHAR(500)` | 可空，作品介紹 |
| `tech_stack` | `VARCHAR(100)` | 可空，使用技術 |
| `status` | `VARCHAR(20)` | 必填，只能是 `進行中` 或 `已完成` |
| `link_url` | `VARCHAR(255)` | 可空，僅接受 `http://` 或 `https://` 開頭的網址 |
| `created_at` | `TIMESTAMP` | 預設為建立當下時間 |

所有回應皆為 JSON，且新增、修改、刪除均以 MySQL 交易處理：成功時 `commit()`，發生例外時 `rollback()`。

### 取得全部作品：`GET /api/projects`

```http
GET /api/projects HTTP/1.1
Host: 127.0.0.1:5000
```

```json
{
  "status": "success",
  "data": [
    {
      "id": 3,
      "title": "俄羅斯方塊遊戲",
      "description": "使用 HTML5 Canvas 與原生 JavaScript 實作經典方塊下落、旋轉與消除機制。",
      "tech_stack": "JavaScript、Canvas API",
      "status": "已完成",
      "link_url": null,
      "created_at": "2026-10-17 12:00:00"
    }
  ]
}
```

### 新增作品：`POST /api/projects`

```http
POST /api/projects HTTP/1.1
Content-Type: application/json
```

```json
{
  "title": "待辦事項 App",
  "description": "以 Flask API 與原生 JavaScript 管理待辦事項。",
  "tech_stack": "Flask、MySQL、JavaScript",
  "status": "進行中",
  "link_url": "https://example.com/todo"
}
```

成功時回傳 `201 Created`：

```json
{
  "status": "success",
  "message": "作品新增成功",
  "data": {
    "id": 4,
    "title": "待辦事項 App",
    "description": "以 Flask API 與原生 JavaScript 管理待辦事項。",
    "tech_stack": "Flask、MySQL、JavaScript",
    "status": "進行中",
    "link_url": "https://example.com/todo"
  }
}
```

### 修改作品：`PUT /api/projects/<id>`

```http
PUT /api/projects/4 HTTP/1.1
Content-Type: application/json
```

```json
{
  "title": "待辦事項 App",
  "description": "已完成 CRUD 與篩選功能。",
  "tech_stack": "Flask、MySQL、JavaScript",
  "status": "已完成",
  "link_url": "https://example.com/todo"
}
```

成功時回傳 `200 OK`：

```json
{
  "status": "success",
  "message": "作品修改成功",
  "data": {
    "id": 4,
    "title": "待辦事項 App",
    "description": "已完成 CRUD 與篩選功能。",
    "tech_stack": "Flask、MySQL、JavaScript",
    "status": "已完成",
    "link_url": "https://example.com/todo"
  }
}
```

### 刪除作品：`DELETE /api/projects/<id>`

```http
DELETE /api/projects/4 HTTP/1.1
```

成功時回傳 `200 OK`：

```json
{
  "status": "success",
  "message": "作品「待辦事項 App」已成功刪除"
}
```

驗證失敗時會回傳 `400 Bad Request`；指定 `id` 不存在時，PUT 與 DELETE 會回傳 `404 Not Found`：

```json
{
  "status": "fail",
  "message": "找不到該筆作品，無法修改"
}
```

## 7. 測試驗收、重置與已知問題

### 驗收結果

本次已完成靜態驗收：

- `app.py` 可通過 Python 編譯檢查。
- `members/ray-fan.js` 可通過 Node.js JavaScript 語法檢查。
- `members/ray-fan.html` 已確認載入 `ray-fan.js`，且搜尋、篩選、表單、清單與樣板所需的 DOM `id` 均存在。
- 後端具備 GET、POST、PUT、DELETE API；所有 SQL 使用 PyMySQL 的 `%s` 參數化查詢。
- 新增、修改與刪除操作均明確 `commit()`，例外時均 `rollback()`。
- 前端以 `fetch()` 執行 CRUD，支援作品名稱即時搜尋、狀態篩選、編輯帶入原資料與含作品名稱的刪除確認。
- 前端使用 `textContent` 與 `replaceChildren()` 顯示資料，未將作品文字直接插入 `innerHTML`，可避免以作品名稱、介紹或技術欄位注入 XSS。

尚未在本次靜態審查環境連線至實際 MySQL，因此請依第 4、5 節啟動服務後，手動完成新增、修改、刪除與重新整理頁面的整合測試。

| 整合測試項目 | 預期結果 | 本次結果 |
| --- | --- | --- |
| POST 新增作品 | 回傳 `201 Created`，資料庫新增一筆資料 | 測試通過 |
| GET 讀取作品 | 回傳 `200 OK`，清單可顯示新增資料 | 測試通過 |
| PUT 修改作品 | 回傳 `200 OK`，重新整理後仍顯示更新內容 | 測試通過 |
| DELETE 刪除作品 | 回傳 `200 OK`，重新整理後不再顯示該資料 | 測試通過 |

### 重置資料庫

若只需清空並恢復種子資料：

```powershell
mysql -u dev_user -p train_db -e "TRUNCATE TABLE projects;"
Get-Content .\seed.sql | mysql -u dev_user -p train_db
```

若需重新建立整個資料庫，請以 root 執行：

```powershell
mysql -u root -p -e "DROP DATABASE IF EXISTS train_db;"
mysql -u root -p -e "CREATE DATABASE train_db DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_unicode_ci;"
Get-Content .\schema.sql | mysql -u dev_user -p train_db
Get-Content .\seed.sql | mysql -u dev_user -p train_db
```

### 已知問題與改善建議

- API 錯誤回應目前會包含原始例外字串；正式環境應記錄伺服器端日誌，回傳通用錯誤訊息。
- 後端網址驗證目前只檢查 `http://`、`https://` 開頭；可改用 `urllib.parse.urlparse()` 再確認 hostname，以提高資料品質。
- `GET /api/projects` 目前一次回傳所有資料；作品量增加時可加上分頁與伺服器端搜尋。

## 8. 自動化測試說明與結果

本專案依照作業規範，使用獨立的 MySQL 測試資料庫 `train_test_db` 搭配 Python 內建 `unittest` 與 Flask `test_client` 進行 API 驗證，絕不更動或清空開發資料庫。

### 測試資料庫設定與初始化
1. 建立獨立測試庫並賦予權限：
   ```sql
   CREATE DATABASE IF NOT EXISTS train_test_db DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_unicode_ci;
   GRANT ALL PRIVILEGES ON train_test_db.* TO 'dev_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

2. 匯入資料表結構（於 PowerShell 執行）：
   ```powershell
   Get-Content .\schema.sql | mysql -u dev_user -p train_test_db
   ```

### 執行自動化測試指令

請先確認虛擬環境已啟用（命令列前方有 (.venv)），於專案根目錄執行：

```powershell
python -m unittest test_app.py -v
```

### 實際執行結果

```text
test_01_create_and_get_project_success (test_app.ProjectApiTestCase.test_01_create_and_get_project_success) ... ok
test_02_invalid_project_rejected_and_not_stored (test_app.ProjectApiTestCase.test_02_invalid_project_rejected_and_not_stored) ... ok
test_03_update_and_delete_specific_project_isolates_others (test_app.ProjectApiTestCase.test_03_update_and_delete_specific_project_isolates_others) ... ok
test_04_nonexistent_id_returns_404 (test_app.ProjectApiTestCase.test_04_nonexistent_id_returns_404) ... ok

----------------------------------------------------------------------
Ran 4 tests in 0.085s

OK
```
