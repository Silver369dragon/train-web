-- 作品管理系統資料庫結構
-- 建立 projects 資料表

CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(80) NOT NULL COMMENT '作品名稱（1~80字）',
    description VARCHAR(500) DEFAULT '' COMMENT '作品介紹（最多500字）',
    technologies VARCHAR(100) DEFAULT '' COMMENT '使用技術（最多100字）',
    status VARCHAR(20) NOT NULL COMMENT '作品狀態（in_progress 或 completed）',
    url VARCHAR(255) DEFAULT '' COMMENT '作品連結（合法的 http:// 或 https://）',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最後更新時間'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
