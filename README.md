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
