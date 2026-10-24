# 學生程式開發團隊｜遠距教學中心

介紹遠距教學中心的學生程式開發團隊，聚焦協助校內各處室推動數位轉型、建立業務系統與自動化行政流程。首頁保留成員卡片清單，點選卡片可進入個人介紹頁。

團隊首頁與一般介紹頁使用繁體中文、HTML、CSS 及本地 SVG，沒有外部字型或追蹤程式。作業四的傅可妮作品管理頁另外使用原生 JavaScript、Flask 與 MySQL，需啟動後端才能使用管理功能。

## 作業四：作品管理系統

作品紀錄頁沿用傅可妮的 `members/keni.html` 及其個人 CSS，透過原生 JavaScript `fetch` 呼叫 Flask API，資料由 MySQL 長期保存。請依下列步驟啟動，不能用 `file://` 直接開作品管理頁，因為那樣不會有 Flask API。

### 版本與套件

- Python：本機 Python 3.13.7；專案 `.venv` 已使用 Python 3.13 建立。
- MySQL：MySQL Server 8.0；本機 `mysqld.exe` 與 `mysql.exe` 均回報 8.0.46，MySQL80 服務正在執行。
- Python 套件版本範圍列在 `requirements.txt`：Flask 3.x、mysql-connector-python 9.1 以上 9.x、python-dotenv 1.x、pytest 8.x。Connector/Python 9.1 起支援 Python 3.13，並支援 MySQL Server 8.0。
- Python 3.13.7、專案虛擬環境與必要套件已在本機驗證；獨立測試資料表已由 Workbench 建立，完整 pytest 與 Flask 驗證已完成。

### Windows MySQL、資料庫與專用帳號

1. 若尚未安裝 MySQL，使用 [MySQL Installer for Windows](https://dev.mysql.com/downloads/installer/) 安裝 MySQL Server 8.0.46 與 MySQL Workbench，安裝時設定 3306 連接埠及 Windows 服務。可參考 [MySQL Windows 安裝手冊](https://dev.mysql.com/doc/refman/8.0/en/windows-installation.html)。MySQL 建議以 Windows Service 執行；以 Windows「服務」確認 `MySQL80` 正在執行，若已停止可從服務管理員啟動，也可用系統管理員 PowerShell 執行 `Start-Service MySQL80`。
2. 在 MySQL Workbench 連線本機 MySQL Server。以有管理權限的本機連線執行下列 SQL。請先將密碼佔位文字換成自己設定的密碼；不要把密碼貼到 Repository 或對話中。Flask 平時只使用 `train_web_414411040_app`，不使用 `root`。

   ```sql
   CREATE DATABASE IF NOT EXISTS train_web_414411040
     CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
   CREATE DATABASE IF NOT EXISTS train_web_414411040_test
     CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

   CREATE USER IF NOT EXISTS 'train_web_414411040_app'@'127.0.0.1'
     IDENTIFIED BY '請在本機換成自己的密碼';
   GRANT SELECT, INSERT, UPDATE, DELETE
     ON train_web_414411040.* TO 'train_web_414411040_app'@'127.0.0.1';
   GRANT SELECT, INSERT, UPDATE, DELETE
     ON train_web_414411040_test.* TO 'train_web_414411040_app'@'127.0.0.1';
   ```

   若帳號已存在且要換密碼，請在 Workbench 另外執行 `ALTER USER 'train_web_414411040_app'@'127.0.0.1' IDENTIFIED BY '你新設定的密碼';`。上述帳號只授予兩個指定資料庫的資料讀寫權限，沒有建表或刪除資料庫權限。

3. 在 Workbench 選取 `train_web_414411040` schema，開啟並執行 `schema.sql`；接著只在這個新開發資料庫執行一次 `seed.sql`。再選取 `train_web_414411040_test` schema，執行一次 `schema.sql` 建立獨立測試表。不要在測試資料庫匯入開發用示範資料。
4. `schema.sql` 只建立資料表，不會刪除既有資料；`seed.sql` 僅手動匯入三筆中文示範作品，不會在 Flask 啟動時執行。之後日常啟動不清空資料，也不會重複匯入。

### Python 環境與啟動

若電腦沒有可用的 Python，請從 [Python 3.13.17 官方 Windows 64-bit 發行頁](https://www.python.org/downloads/release/python-31317/) 安裝 Python；本次沒有代為安裝。安裝後先確認 `py -3.13 --version` 可正常執行。在 Repository 根目錄以 PowerShell 建立環境：

```powershell
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

以文字編輯器開啟 `.env`，填入本機資料庫帳號密碼。範例如下，密碼只放在未追蹤的 `.env`：

```dotenv
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=train_web_414411040
DB_USER=train_web_414411040_app
DB_PASSWORD=填入你在本機設定的密碼
TEST_DB_NAME=train_web_414411040_test
```

啟動 Flask：

```powershell
python app.py
```

在瀏覽器開啟作品管理頁：<http://127.0.0.1:5000/members/keni.html>。團隊首頁由 Flask 提供於 <http://127.0.0.1:5000/>。停止服務請回到終端機按 Ctrl+C。重新整理或重新啟動 Flask 都會重新從 MySQL 讀取資料。

### 資料表與 API

`projects` 使用 InnoDB 與 `utf8mb4`：`id` 為自動遞增主鍵；`name` 必填、1～80 字；`description` 選填、最多 500 字；`technologies` 選填、最多 100 字；`status` 限「進行中」或「已完成」；`url` 選填，只接受有效的 HTTP/HTTPS 網址。建立時間由 MySQL 記錄。API 錯誤格式為 `{"error":"說明","fields":{"欄位":"原因"}}`，欄位錯誤為 400、不存在的作品為 404、資料庫無法使用為 503。

PowerShell 請求範例：

```powershell
# 查詢：回傳作品 JSON 陣列
Invoke-RestMethod http://127.0.0.1:5000/api/projects

# 新增：成功回傳 201 與包含資料庫 id 的作品 JSON
$body = @{ name = '我的測試作品'; description = '作品說明'; technologies = 'Python、Flask'; status = '進行中'; url = 'https://example.com/project' } | ConvertTo-Json
Invoke-RestMethod http://127.0.0.1:5000/api/projects -Method Post -ContentType 'application/json' -Body $body

# 修改：將 1 換成要修改的作品 id，成功回傳更新後作品
$body = @{ name = '修改後作品'; description = ''; technologies = 'Flask'; status = '已完成'; url = '' } | ConvertTo-Json
Invoke-RestMethod http://127.0.0.1:5000/api/projects/1 -Method Put -ContentType 'application/json' -Body $body

# 刪除：成功回傳 HTTP 204，沒有 response body
Invoke-WebRequest http://127.0.0.1:5000/api/projects/1 -Method Delete
```

新增範例回應：

```json
{
  "id": 4,
  "name": "我的測試作品",
  "description": "作品說明",
  "technologies": "Python、Flask",
  "status": "進行中",
  "url": "https://example.com/project"
}
```

### 自動化測試

測試使用 Flask test client 與獨立 MySQL 測試資料庫 `train_web_414411040_test`。在 `.env` 設定 `TEST_DB_NAME`，並確認測試 schema 已執行過 `schema.sql`；再於已啟用的虛擬環境執行：

```powershell
python -m pytest -q
```

測試包含新增後查詢、空白與超長欄位、不合法狀態與網址、修改保留 ID 並不影響另一筆作品、刪除指定資料、不存在 ID 回傳 404，以及測試資料庫隔離檢查。每個測試開始前只會刪除名稱以 `_test` 結尾、且實際連線名稱與設定一致的測試資料庫 `projects` 資料；如果設定錯誤，測試會停止，不會清空開發資料庫。請勿把 `TEST_DB_NAME` 設成開發資料庫名稱。

**目前實際結果：** 使用 Python 3.13.7 建立 `.venv` 並安裝 `requirements.txt` 成功；實際套件版本為 Flask 3.1.3、mysql-connector-python 9.7.0、python-dotenv 1.2.4、pytest 8.4.2。專用帳號可連線正式庫與測試庫。正式庫在驗證前後皆為 3 筆，逐筆比對 `id`、名稱、說明、技術、狀態及網址後完全相同；測試沒有修改正式資料。

在 `.venv` 執行 `python -m pytest -q`，最後一次結果為 **14 passed in 0.25s**（前一次亦為 14 passed）。測試使用 `train_web_414411040_test`，涵蓋新增與查詢、無效資料、修改並保留 ID、指定刪除、404 及資料庫隔離。另以本機 Flask HTTP 伺服器直接對測試庫驗證 GET 200、POST 201、GET 新增資料 200、PUT 200（ID 保留）、停止並重啟 Flask 後仍讀到修改資料、DELETE 204 及刪除後 GET 空清單 200；CRUD 後測試庫已恢復空清單。

Flask 首頁 `/`、作品管理頁 `/members/keni.html` 及正式庫作品 API 均回 200，API 讀到 3 筆。正式庫 Flask 停止並重啟後再次讀取，3 筆資料與驗證前逐筆相同。測試資料表需先由 Workbench 建立，因日常 Flask 專用帳號沒有 CREATE 權限；pytest 會在確認實際連線資料庫為指定 `_test` 資料庫後才清理該測試表。

### 資料重置與已知問題

- 若要重新開始開發資料，請在 Workbench 確認選取的是 `train_web_414411040` 後，手動執行 `DELETE FROM projects;`，再手動執行 `seed.sql`。這會刪除該開發資料庫中的全部作品，請先確認沒有需要保留的資料。測試資料的清理由 pytest 限定於 `_test` 資料庫。
- 沒有使用登入或權限分隔；這是本機課程作業，不應直接公開到網際網路。
- MySQL80 服務目前執行中，MySQL Server 與客戶端版本為 8.0.46。正式資料為 `seed.sql` 的三筆範例。日常 Flask 帳號沒有建立資料表的權限，因此若測試庫尚未建立 `projects`，需先由 Workbench 管理連線選取 `train_web_414411040_test` 並執行 `schema.sql`；目前測試表已建立且測試通過。

### 前端、Flask 與 MySQL 資料流程

使用者在 `members/keni.html` 操作表單 → `members/keni.js` 前端驗證後以 `fetch` 傳送 JSON → `app.py` 的 Flask API 再驗證 → 使用參數化 SQL 在 MySQL `projects` 表查詢或以交易新增、修改、刪除 → Flask 回傳 JSON/HTTP 狀態 → JavaScript 以 `textContent` 更新畫面。JavaScript 陣列僅作為目前頁面的顯示快取，不是永久資料來源。

## 開啟方式

團隊首頁及一般靜態頁可直接以瀏覽器開啟 `index.html`，個人介紹範本位於 `members/template.html`。傅可妮的作品管理頁必須依上方步驟啟動 Flask，否則無法呼叫 API。

若電腦有 Python，可在本資料夾執行：

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

然後開啟 `http://127.0.0.1:8000`。按 Ctrl+C 停止。

## 檔案結構

```text
train-web/
  app.py                 Flask 頁面與作品 API
  requirements.txt       Python 套件
  schema.sql             projects 資料表
  seed.sql               三筆中文示範作品（手動匯入一次）
  .env.example           本機環境設定範本
  .gitignore             排除本機密碼、虛擬環境及資料庫備份
  tests/                 獨立 MySQL 測試
  index.html             首頁：團隊介紹、合作方向、成員與常見問題
  styles.css             全站共用樣式與手機版規則
  members/keni.html      傅可妮個人頁與作品管理介面
  members/keni.js        作品 API 呼叫與畫面互動
  members/keni.css       作品管理介面樣式
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
