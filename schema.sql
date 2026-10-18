-- 1. 建立作業專用資料庫（支援完整 UTF-8 中文）
CREATE DATABASE IF NOT EXISTS train_db
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE train_db;

-- 2. 建立作品資料表
CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(80) NOT NULL,
    description VARCHAR(500),
    tech_stack VARCHAR(100),
    status VARCHAR(20) NOT NULL,
    link_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 建立專用開發帳號（密碼請依各人 .env 設定調整）
CREATE USER IF NOT EXISTS 'dev_user'@'localhost' IDENTIFIED BY 'DevPass123!';
GRANT ALL PRIVILEGES ON train_db.* TO 'dev_user'@'localhost';
FLUSH PRIVILEGES;