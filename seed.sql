USE train_db;

-- 匯入至少 3 筆示範作品資料（涵蓋「進行中」與「已完成」狀態）
INSERT INTO projects (title, description, tech_stack, status, link_url) VALUES
('個人介紹網站', '建立自己的個人自我介紹卡片與專屬頁面，完成無障礙設計並提交 PR 合併。', 'HTML、CSS', '已完成', 'https://example.com'),
('作品紀錄管理系統', '使用原生 JavaScript 實作作品清單的管理、編輯、篩選與即時搜尋功能。', 'HTML、CSS、JavaScript', '進行中', NULL),
('俄羅斯方塊遊戲', '使用 HTML5 Canvas 與原生 JavaScript 實作經典方塊下落、旋轉與消除機制。', 'JavaScript、Canvas API', '已完成', NULL);