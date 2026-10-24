-- Import this sample data once into a new, empty development database.
-- Daily Flask startup never runs this file.
INSERT INTO projects (name, description, technologies, status, url) VALUES
  (
    '個人介紹網站',
    '整理個人背景、技術專長與學習方向，練習響應式網頁排版。',
    'HTML、CSS',
    '已完成',
    'https://example.com/portfolio'
  ),
  (
    '課程點名系統',
    '管理課堂點名紀錄，並依日期整理學生出缺席狀況。',
    'HTML、CSS、JavaScript',
    '已完成',
    'https://cornelia261610-afk.github.io/attendance-system/'
  ),
  (
    '課程資料整理工具',
    '整理課程資訊並提供簡單的分類與查詢功能。',
    'Python、CSV',
    '進行中',
    ''
  );
