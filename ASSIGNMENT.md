# 作業：新增自己的 Self-introduction Card

## 作業目標

在團隊網站新增自己的自我介紹卡片與個人介紹頁，練習完整的 GitHub 協作流程：

**Fork → Clone → 建立分支 → 修改與檢查 → Commit → Push → 開 Pull Request → Code Review → 修改與複查 → 合併。**

原始 Repository：[Silver369dragon/train-web](https://github.com/Silver369dragon/train-web)

## 一、開始前準備

- 準備 GitHub 帳號、Git、程式碼編輯器及瀏覽器。
- 閱讀 [README.md](README.md)，確認能在本機開啟 `index.html`。
- 確認 Git 已設定自己的提交姓名與電子郵件；不想公開信箱時，可使用 GitHub 提供的 noreply 信箱。
- 本作業只需 HTML、CSS，不需安裝框架、建立後端或資料庫。

## 二、Fork 與 Clone

1. 前往原始 Repository，點選 **Fork**，在自己的 GitHub 帳號下建立副本。
2. Clone **自己的 Fork** 到電腦，不是直接 Clone 學長的 Repository 進行提交。

以下指令中的 `YOUR_GITHUB_USERNAME` 請換成自己的 GitHub 帳號：

```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/train-web.git
cd train-web
git remote -v
```

確認 `origin` 指向自己的 Fork。

## 三、建立作業分支

從最新的 `main` 建立分支，不要直接在 `main` 上完成作業。

分支命名格式：

```text
dev/學號/要做的東西
```

例如：

```text
dev/b12345678/self-introduction-card
```

第一段固定使用 `dev`，第二段填自己的學號，第三段簡短描述要做的功能。本次作業使用 `self-introduction-card`；功能名稱使用小寫英文與連字號 `-`，不要包含空白。

以下指令以學號 `b12345678`、個人頁檔名 `chen-yu.html` 示範，請分別替換成自己的學號與檔名：

```bash
git switch main
git pull --ff-only origin main
git switch -c dev/b12345678/self-introduction-card
git branch --show-current
```

如果是以前建立的 Fork，請先在 GitHub 的 Fork 頁面使用 **Sync fork** 同步原始專案，再執行以上步驟。若有衝突或分支已存在，先確認目前狀態，不要強制覆蓋。

## 四、實作要求

### 1. 建立自己的個人介紹頁

- 複製 `members/template.html`，另存為 `members/自己的名字或學號.html`，例如 `members/chen-yu.html`。
- 保留原本的 `template.html`，讓其他同學可以繼續使用。
- 填寫姓名或公開暱稱、系級或團隊角色、一句自我介紹、約 100～200 字簡介，以及 3～5 項專長或正在學習的技術。
- 更新頁面標題、description、麵包屑、頁尾等範本內容，移除自己頁面上的範本提示。
- 專案經驗、GitHub、個人網站與照片可自由補充；沒有的項目可移除，並同步移除對應章節導覽。
- 不必提供電話、住址或私人聯絡資訊，只放願意公開的內容。

### 2. 在首頁新增自己的卡片

- 在 `index.html` 的 `id="team"` 區塊中，將自己的卡片加入 `.member-grid` 清單。
- 可參考 README 的卡片範例，填寫自己的姓名、角色、簡介與技術標籤。
- 卡片連結必須指向自己的個人頁，例如 `members/chen-yu.html`，並更新 `aria-label`。
- 移除自己卡片上的「範本預覽」標示；不要刪除或覆寫其他同學的卡片。
- 沿用現有樣式；若需修改 `styles.css`，請確認其他頁面的版型正常。

### 3. 圖片與路徑

- 照片非必填，可保留文字頭像或使用有權使用的圖片。
- 圖片放在 `assets/`，使用不會與他人重複的檔名，例如 `chen-yu.webp`，建議小於 300 KB。
- 使用相對路徑，留意首頁與 `members/` 個人頁的層級不同，以及檔名大小寫是否一致。
- 有意義的圖片需提供合適的 `alt` 文字。

## 五、本機檢查、Commit 與 Push

先用瀏覽器開啟首頁，完成下方驗收清單，再提交變更。

```bash
git status
git diff
git add index.html members/chen-yu.html
```

若有新增圖片或修改樣式，再用 `git add` 指定相關檔案。不要提交與作業無關的檔案、密碼、API key 或暫存檔。

```bash
git diff --staged
git diff --cached --check
git commit -m "feat: add chen-yu self-introduction card"
git push -u origin dev/b12345678/self-introduction-card
```

Commit 訊息要描述實際修改，不要只寫 `update` 或 `修改`。可有多筆有意義的 commit，不必強制只留一筆。

**Commit 是將修改記錄在本機；Push 才會把這個分支與 commit 上傳到自己的 GitHub Fork。**

## 六、回到原始 Repository 開 Pull Request

Push 完成後，在 GitHub 建立 Pull Request（PR）。請確認比較方向：

| 欄位 | 應選擇的內容 |
| --- | --- |
| Base repository（接收修改） | `Silver369dragon/train-web` |
| Base branch（目標分支） | `main` |
| Head repository（提供修改） | 自己帳號下的 `train-web` Fork |
| Compare branch（作業分支） | `dev/學號/要做的東西` |

不要只對自己的 Fork 開 PR。若看不到自己的分支，可使用 **compare across forks** 選擇 Fork 與分支。

送出前檢查 **Files changed**，確認只有自己的作業變更。

PR 標題範例：`新增陳宇的自我介紹卡片與個人頁`

PR 說明請使用以下格式，勾選前需實際完成檢查，並附上畫面截圖：

```markdown
## 作業作者
- 姓名／課堂識別名稱：
- GitHub 帳號：

## 修改內容
- 個人介紹頁路徑：
- 新增或修改了哪些內容：

## 自我檢查
- [ ] 首頁顯示自己的卡片，點擊後可進入自己的個人頁
- [ ] 個人頁的返回首頁與章節導覽正常
- [ ] 桌面與手機寬度下，文字、卡片與圖片沒有重疊或橫向溢出
- [ ] 連結與圖片路徑正確，沒有遺留範本文字
- [ ] 其他成員卡片與既有頁面仍正常
- [ ] Files changed 只有本次作業相關檔案

## 畫面截圖
請附上首頁卡片與個人頁截圖，至少包含一張手機寬度的畫面。

## 需要協助的地方
沒有則填「無」。
```

## 七、Code Review、修改與複查

1. PR 送出後，等待學長進行 Code Review。
2. 收到修改建議後，在**同一個作業分支**修改並重新檢查。
3. 將修改再次 commit、push；原本的 PR 會自動更新，不需要重新開一個 PR。
4. 在 PR 回覆每項意見的處理方式；不理解的建議可直接留言詢問。修改完成後，通知 reviewer 複查。
5. 若 PR 有衝突，先同步原始專案的 `main` 並解決衝突，保留自己與其他同學的內容，再檢查、commit、push。不熟悉時請向老師或助教求助，不要直接覆蓋整個檔案。
6. 若 GitHub 顯示自動檢查，需確認通過；若沒有設定自動檢查，仍需完成手動驗收，不能視為已自動驗證。
7. 等待 review 與檢查通過後，由維護者合併 PR；同學不要自行合併。

Review 後再次提交的範例：

```bash
git branch --show-current
git status
git diff
git add index.html members/chen-yu.html
git diff --staged
git diff --cached --check
git commit -m "fix: address self-introduction review feedback"
git push
```

如有修改其他相關檔案，也要明確加入暫存區。一般修改不需要 force push。

## 八、繳交內容與完成條件

**繳交原始 Repository 上的 PR 連結**，不要只交 Fork 網址或截圖。繳交管道與期限由老師另行公告。

- **已繳交：** PR 已送至原始 Repository 的 `main`，說明與截圖完整。
- **待修改：** 收到 review 意見或檢查失敗，需在原 PR 繼續處理。
- **作業完成：** 功能與版面驗收通過、review 意見已處理，且 PR 已由維護者合併。

合併後再到原始 Repository 確認自己的卡片與個人頁已納入 `main`。作業分支可在合併後刪除，並同步自己的 Fork，供下一次練習使用。

> 本專案目前為純 HTML/CSS，沒有設定 typecheck、測試或 lint 指令。驗收以實際瀏覽操作、HTML/CSS 與路徑檢查為主；`git diff --check` 只能檢查部分空白格式問題，不能取代功能與版面檢查。
