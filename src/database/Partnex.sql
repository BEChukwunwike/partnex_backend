CREATE DATABASE IF NOT EXISTS partnex_db;
USE partnex_db;
CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('sme','investor','admin') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

SHOW TABLES;
--SME profile
CREATE TABLE IF NOT EXISTS smes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  owner_user_id BIGINT NOT NULL,
  business_name VARCHAR(255) NOT NULL,
  industry VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  years_of_operation INT NOT NULL,
  employees INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_user_id) REFERENCES users(id)
);
-- Investor profile
CREATE TABLE IF NOT EXISTS investors (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  owner_user_id BIGINT NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  organization VARCHAR(255),
  location VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_user_id) REFERENCES users(id)
);

-- 2) Statement of account uploads
CREATE TABLE IF NOT EXISTS soa_uploads (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  sme_id BIGINT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_type ENUM('csv','xlsx','pdf') NOT NULL,
  status ENUM('UPLOADED','PARSED','FAILED') DEFAULT 'UPLOADED',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sme_id) REFERENCES smes(id)
);

-- 3) SME credibility scores
CREATE TABLE IF NOT EXISTS sme_scores (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  sme_id BIGINT NOT NULL,
  score INT NOT NULL,
  risk_level ENUM('LOW','MEDIUM','HIGH') NOT NULL,
  explanation_json JSON NULL,
  model_version VARCHAR(50) DEFAULT 'v1',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sme_id) REFERENCES smes(id)
);

-- 4) SME financial summary (AI model inputs)
CREATE TABLE IF NOT EXISTS sme_financial_summary (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  sme_id BIGINT NOT NULL,

  revenue DECIMAL(15,2) NOT NULL,
  expenses DECIMAL(15,2) NOT NULL,
  debt DECIMAL(15,2) NOT NULL,
  revenue_growth DECIMAL(10,4) NOT NULL,
  reporting_consistency DECIMAL(10,4) NOT NULL,
  impact_score DECIMAL(10,4) NOT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sme_id) REFERENCES smes(id),
  INDEX (sme_id)
);

ALTER TABLE sme_scores MODIFY score DECIMAL(5,2) NOT NULL;
INSERT INTO sme_financial_summary
(sme_id, revenue, expenses, debt, revenue_growth, reporting_consistency, impact_score)
VALUES
(1, 1200000, 800000, 200000, 0.12, 0.90, 0.70);
SELECT id, sme_id, score, risk_level, model_version, created_at
FROM sme_scores
WHERE sme_id = 1
ORDER BY created_at DESC
LIMIT 5;