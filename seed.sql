-- 作品管理系統示範資料
-- 匯入至少 3 筆示範作品（包含進行中與已完成）

INSERT INTO projects (name, description, technologies, status, url) VALUES
('個人介紹網站', '陳歆的個人自我介紹頁面，採用語意化 HTML5 與現代化 CSS3 建立良好排版，展現個人背景、專長與作品。', 'HTML、CSS', 'completed', 'https://github.com/arielchen0807/train-web'),
('作品紀錄管理系統', '以原生 JavaScript 開發的作品紀錄管理介面，支援作品新增、編輯、刪除、即時關鍵字搜尋與狀態篩選功能。', 'HTML、CSS、JavaScript', 'in_progress', 'https://github.com/arielchen0807/train-web'),
('選課系統', '利用自訂資料結構管理課程資料，實作課表碰撞偵測演算法與快速篩選查詢功能。', 'C++', 'completed', '');
