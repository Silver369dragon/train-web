# 學生程式開發團隊｜遠距教學中心

介紹遠距教學中心的學生程式開發團隊，聚焦協助校內各處室推動數位轉型、建立業務系統與自動化行政流程。首頁保留成員卡片清單，點選卡片可進入個人介紹頁。

使用繁體中文、HTML 與 CSS 製作的響應式靜態網站。插畫與網站圖示為本地 SVG，無 JavaScript、框架、外部字型、追蹤程式或後端依賴；離線也能瀏覽。

## 開啟方式

直接以瀏覽器開啟 `index.html` 即可，個人介紹頁位於 `members/template.html`。

若電腦有 Python，可在本資料夾執行：

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

然後開啟 `http://127.0.0.1:8000`。按 Ctrl+C 停止。

## 檔案結構

```text
train-web/
  index.html             首頁：團隊介紹、合作方向、成員與常見問題
  styles.css             全站共用樣式與手機版規則
  assets/
    favicon.svg          網站圖示
    learning.svg         行政流程、程式與報表的首頁插畫
  members/
    template.html        可直接複製的個人介紹頁
  README.md              使用方法與個人頁擴充規劃
```

## 現階段如何新增個人介紹

建議先使用「成員提供資料，維護者更新靜態頁」的方式。少量成員不需要先建立後台。

1. 成員提供：姓名、團隊角色／就讀系級、一句開發理念、100 至 200 字簡介、3 至 5 項技術專長，以及自願公開的照片、專案經驗、GitHub／個人網站與聯絡資訊。
2. 複製 `members/template.html`，例如命名成 `members/chen-yu.html`。檔名使用小寫英文與連字號，每位成員使用不同檔名。
3. 依檔案內註解修改姓名、內容、`<title>`、description、麵包屑與頁尾；完成後移除範本提示。沒有專案或聯絡資訊的欄位，可連同對應章節導覽刪除。
4. 若有照片，放入 `assets/`，建議使用約 600 × 720 像素、300 KB 以下的 WebP 或 JPEG。把 `.profile-portrait` 整段替換成：

   ```html
   <img
     class="profile-photo"
     src="../assets/chen-yu.webp"
     width="250"
     height="280"
     alt="陳宇的個人照片"
   />
   ```

5. 在首頁 `id="team"` 的 `.member-grid` 清單中，複製包含 `a.member-card` 的 `<li>`，或用下列卡片替換預留位置。修改姓名、角色、摘要、專長、連結與 `aria-label`；每位成員各連到自己的個人頁。資料填妥後移除該卡的「範本預覽」標示；全部換成正式資料後再移除區塊下方的示範提醒。

   ```html
   <li>
     <a class="member-card" href="members/chen-yu.html" aria-label="認識陳宇">
       <div class="member-card-header">
         <span class="member-avatar" aria-hidden="true">陳</span>
         <div class="member-info">
           <h3>陳宇</h3>
           <p>前端開發</p>
         </div>
       </div>
       <p class="member-summary">把處室需求轉化成清楚、易用的網頁介面。</p>
       <div class="tag-row"><span>介面設計</span><span>網頁開發</span></div>
       <div class="member-card-footer">
         <span class="member-status">系統開發</span
         ><span>個人介紹 <span aria-hidden="true">→</span></span>
       </div>
     </a>
   </li>
   ```

   所有卡片都放在同一個 `.member-grid`，桌面三欄、1100px 以下兩欄、760px 以下一欄，超出一列會自動往下排列。預留位置只是排版示意，沒有新增或儲存功能，可直接替換或刪除。有照片時可將 `span.member-avatar` 改成 `<img class="member-avatar" src="assets/chen-yu.webp" width="64" height="64" alt="陳宇的個人照片">`。

6. 確認首頁連結、返回首頁、章節導覽、手機版與照片均正常，並請成員確認公開內容，再將更新檔案交由維護者發布。

上述姓名僅為操作範例。請依真實資料填寫，不要直接將範例當成正式成員發布。

## 後續讓成員自行新增的施作規劃

### 第一階段：目前即可使用

- 每人一份 HTML，所有頁面共用 `styles.css`。
- 成員提供文字與照片，維護者複製範本、檢查並加入首頁。
- 適合成員少、更新頻率低的情境；優點是容易理解、沒有資料庫維護成本。
- 驗收：新增一位成員後，首頁能開啟其個人頁，個人頁能返回首頁，手機不橫向溢出。

## 設計與維護

- 色彩：米白背景 `#f7f6f0`、深綠文字 `#243f36`、橘色操作重點 `#bb512d`；在 CSS 的 `:root` 統一調整。
- 字體：中文無襯線用於導覽與內文，宋體用於理念句；使用本機字體，不需載入外部資源。
- 版面：最大寬度 1240px，夥伴清單依螢幕寬度使用三欄、兩欄或一欄；760px 以下改為單欄，行動版保留完整導覽。
- 元件：共用按鈕、服務卡片、個人卡片；常見問題使用原生 `details/summary`，無需 JavaScript。
- 無障礙：提供跳至內容、語意區塊、圖片替代文字、鍵盤焦點與減少動畫設定。

## 檢查方式

這是 HTML/CSS 靜態專案，沒有 TypeScript 或應用程式 JavaScript，因此 typecheck 不適用。修改後應檢查 HTML 結構、CSS 語法、相對路徑、圖片、錨點與導覽，並實際以桌面和手機尺寸操作個人頁與原生 FAQ。網站不需要 build 或安裝 npm 套件才能執行。


---

# 作業四：Flask、MySQL 全端實作（作品管理系統）

本專案於作業四加入 Flask 後端與 MySQL 資料庫，將陳歆的個人作品紀錄管理（`members/chenhsin.html`）升級為全端架構，支援資料持久化保存、RESTful API 串接與自動化單元測試。

## 1. 系統需求與使用技術

- **Python**: 3.10+ (本機開發環境為 Python 3.14)
- **MySQL Server**: 8.0+
- **必要套件**（詳見 `requirements.txt`）：
  - `Flask>=3.0.0`：輕量級 Python Web 框架，提供靜態檔案伺服與 API 路由。
  - `PyMySQL>=1.1.0`：純 Python MySQL 客戶端連線套件。
  - `python-dotenv>=1.0.0`：管理 `.env` 環境變數。
  - `pytest>=8.0.0`：後端自動化單元測試工具。
  - `cryptography>=42.0.0`：支援 MySQL 8 密碼驗證演算法。

---

## 2. MySQL 安裝與帳號資料庫建置指南

### Windows 環境
1. 下載並安裝 **MySQL Community Server** 或 **XAMPP**。
2. 開啟 **MySQL Workbench** 或以管理員身分開啟 PowerShell，啟動 MySQL 服務：
   ```powershell
   net start MySQL80
   ```
3. 登入 MySQL root：
   ```powershell
   mysql -u root -p
   ```
4. 建立專用資料庫與專用帳號（不使用 root 日常連線）：
   ```sql
   CREATE DATABASE IF NOT EXISTS train_web CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE DATABASE IF NOT EXISTS train_web_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER IF NOT EXISTS 'train_user'@'localhost' IDENTIFIED BY '<your_password>';
   GRANT ALL PRIVILEGES ON train_web.* TO 'train_user'@'localhost';
   GRANT ALL PRIVILEGES ON train_web_test.* TO 'train_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

### macOS 環境
1. 使用 Homebrew 安裝並啟動：
   ```bash
   brew install mysql
   brew services start mysql
   ```
2. 建立資料庫與專用帳號：
   ```sql
   CREATE DATABASE IF NOT EXISTS train_web CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE DATABASE IF NOT EXISTS train_web_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER IF NOT EXISTS 'train_user'@'localhost' IDENTIFIED BY '<your_password>';
   GRANT ALL PRIVILEGES ON train_web.* TO 'train_user'@'localhost';
   GRANT ALL PRIVILEGES ON train_web_test.* TO 'train_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

---

## 3. Python 虛擬環境與環境變數設定

1. **建立並啟用虛擬環境**：
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   - **macOS / Linux**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

2. **安裝必要依賴套件**：
   ```bash
   pip install -r requirements.txt
   ```

3. **配置環境變數**：
   複製 `.env.example` 為 `.env`，並依本機資料庫設定修改：
   ```bash
   cp .env.example .env
   ```
   `.env` 內容範例：
   ```ini
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_NAME=train_web
   DB_USER=train_user
   DB_PASSWORD=<你的資料庫密碼>
   TEST_DB_NAME=train_web_test
   FLASK_APP=app.py
   FLASK_ENV=development
   PORT=5001
   ```

---

## 4. 資料庫初始化與匯入示範資料

本系統日常啟動不會重複清空資料。初次使用請執行以下步驟建表與匯入示範資料：

1. **建立資料表結構 (`schema.sql`)**：
   ```bash
   mysql -u train_user -p train_web < schema.sql
   mysql -u train_user -p train_web_test < schema.sql
   ```
2. **匯入初始示範資料 (`seed.sql`)**（僅匯入開發資料庫 `train_web`）：
   ```bash
   mysql -u train_user -p train_web < seed.sql
   ```
3. **資料重置方式**：
   若需清空重設開發資料庫，可使用以下指令：
   ```sql
   TRUNCATE TABLE train_web.projects;
   ```
   再重新匯入 `seed.sql` 即可。

---

## 5. Flask 啟動與操作網址

在啟用虛擬環境後，於專案根目錄執行：

```bash
python app.py
```

開啟瀏覽器前往：
- **團隊首頁**：[http://127.0.0.1:5001](http://127.0.0.1:5001)
- **陳歆的作品管理頁面**：[http://127.0.0.1:5001/members/chenhsin.html](http://127.0.0.1:5001/members/chenhsin.html)

---

## 6. 資料庫欄位與 API 規格說明

### 資料表 `projects` 欄位設計
| 欄位名稱 | 型態 | 限制與說明 |
| :--- | :--- | :--- |
| `id` | INT AUTO_INCREMENT | 主鍵，不可編輯，修改時保持不變 |
| `name` | VARCHAR(80) | 必填，去除前後空白後為 1～80 字 |
| `description` | VARCHAR(500) | 選填，最多 500 字 |
| `technologies` | VARCHAR(100) | 選填，最多 100 字，以逗點分隔 |
| `status` | VARCHAR(20) | 必填，限 `in_progress`（進行中）或 `completed`（已完成） |
| `url` | VARCHAR(255) | 選填，必須為合法之 `http://` 或 `https://` 網址 |
| `created_at` | TIMESTAMP | 建立時間，預設當前時間 |
| `updated_at` | TIMESTAMP | 最後修改時間，隨資料更新自動更新 |

### RESTful API 端點與範例

#### 1. 取得所有作品
- **Method**: `GET`
- **URL**: `/api/projects`
- **Response**: `200 OK`
  ```json
  [
    {
      "id": 1,
      "name": "個人介紹網站",
      "description": "陳歆的個人自我介紹頁面...",
      "technologies": "HTML、CSS",
      "status": "completed",
      "url": "https://github.com/arielchen0807/train-web",
      "created_at": "2026-10-18 10:43:17",
      "updated_at": "2026-10-18 10:43:17"
    }
  ]
  ```

#### 2. 新增作品
- **Method**: `POST`
- **URL**: `/api/projects`
- **Request Body**:
  ```json
  {
    "name": "智慧生活小幫手",
    "description": "運用 AI 串接日曆與代辦事項的個人小工具",
    "technologies": "Python, Flask, MySQL",
    "status": "in_progress",
    "url": "https://github.com/arielchen0807"
  }
  ```
- **Response**: `201 Created`
  ```json
  {
    "id": 4,
    "name": "智慧生活小幫手",
    "status": "in_progress",
    "created_at": "2026-10-18 10:45:00"
  }
  ```
- **錯誤回應**: `400 Bad Request`（如名稱為空、字數超標或狀態不合法）
  ```json
  {
    "error": "請輸入作品名稱"
  }
  ```

#### 3. 修改作品
- **Method**: `PUT`
- **URL**: `/api/projects/<id>`
- **Request Body**: 同新增作品格式
- **Response**: `200 OK`（回傳更新後物件）或 `404 Not Found`（作品不存在）

#### 4. 刪除作品
- **Method**: `DELETE`
- **URL**: `/api/projects/<id>`
- **Response**: `200 OK`
  ```json
  {
    "message": "作品「智慧生活小幫手」已成功刪除",
    "id": 4
  }
  ```
- **錯誤回應**: `404 Not Found`（作品不存在）

---

## 7. 自動化測試與驗證

本專案撰寫了完整的單元測試，使用獨立測試資料庫 `train_web_test`，測試執行前後會自動重設測試資料庫，**保證不污染或清空日常開發的資料庫**。

### 執行測試指令
```bash
pytest tests/test_projects.py -v
```

### 實際測試結果
```text
============================= test session starts ==============================
platform darwin -- Python 3.14.6, pytest-9.1.1, pluggy-1.7.0 -- /Users/ariel/train-web/venv/bin/python3.14
cachedir: .pytest_cache
rootdir: /Users/ariel/train-web
collecting ... collected 7 items

tests/test_projects.py::test_get_projects_empty PASSED                   [ 14%]
tests/test_projects.py::test_create_and_retrieve_project PASSED          [ 28%]
tests/test_projects.py::test_reject_invalid_name PASSED                  [ 42%]
tests/test_projects.py::test_reject_invalid_status_and_url PASSED        [ 57%]
tests/test_projects.py::test_update_project_and_isolation PASSED         [ 71%]
tests/test_projects.py::test_delete_project_and_isolation PASSED         [ 85%]
tests/test_projects.py::test_nonexistent_id_returns_404 PASSED           [100%]

============================== 7 passed in 0.39s ===============================
```

### 已知問題
- 無已知問題，所有 CRUD 功能、前後端防注入與狀態隔離均通過驗收。
