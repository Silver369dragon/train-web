-- Select the intended database in MySQL Workbench before running this file.
-- This script creates the table only; it does not delete or seed existing data.
CREATE TABLE IF NOT EXISTS projects (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(80) NOT NULL,
  description VARCHAR(500) NOT NULL DEFAULT '',
  technologies VARCHAR(100) NOT NULL DEFAULT '',
  status ENUM('進行中', '已完成') NOT NULL DEFAULT '進行中',
  url TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;
