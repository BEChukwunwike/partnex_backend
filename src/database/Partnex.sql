CREATE DATABASE IF NOT EXISTS partnex_db;
USE partnex_db;

-- USERS TABLE

CREATE TABLE IF NOT EXISTS users (
  id INT NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('sme','investor','admin') DEFAULT 'sme',
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- SME PROFILES

CREATE TABLE IF NOT EXISTS smes (
  id INT NOT NULL AUTO_INCREMENT,
  owner_user_id INT NOT NULL,

  -- Core Business Info
  business_name VARCHAR(255) NOT NULL,
  industry_sector VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  years_of_operation INT NOT NULL,
  number_of_employees INT NOT NULL,

  -- Annual Revenue (2 required, 1 optional)
  annual_revenue_year_1 SMALLINT NOT NULL,
  annual_revenue_amount_1 DECIMAL(18,2) NOT NULL,

  annual_revenue_year_2 SMALLINT NOT NULL,
  annual_revenue_amount_2 DECIMAL(18,2) NOT NULL,

  annual_revenue_year_3 SMALLINT NULL,
  annual_revenue_amount_3 DECIMAL(18,2) NULL,

  -- Financial Data
  monthly_revenue DECIMAL(18,2) NULL,
  monthly_expenses DECIMAL(18,2) NOT NULL,
  existing_liabilities DECIMAL(18,2) NOT NULL,

  -- Funding History
  prior_funding_history TEXT NOT NULL,
  repayment_history TEXT NULL,

  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  CONSTRAINT fk_smes_owner_user
    FOREIGN KEY (owner_user_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  UNIQUE KEY uq_smes_owner_user (owner_user_id),
  INDEX idx_smes_industry_sector (industry_sector),
  INDEX idx_smes_location (location)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- INVESTOR PROFILES

CREATE TABLE IF NOT EXISTS investors (
  id INT NOT NULL AUTO_INCREMENT,
  owner_user_id INT NOT NULL,

  full_name VARCHAR(255) NOT NULL,
  organization VARCHAR(255) NULL,
  location VARCHAR(255) NOT NULL,

  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  CONSTRAINT fk_investors_owner_user
    FOREIGN KEY (owner_user_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  UNIQUE KEY uq_investors_owner_user (owner_user_id),
  INDEX idx_investors_location (location)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- SME CREDIBILITY SCORES

CREATE TABLE IF NOT EXISTS sme_scores (
  id INT NOT NULL AUTO_INCREMENT,
  sme_id INT NOT NULL,

  score DECIMAL(5,2) NOT NULL,
  risk_level ENUM('LOW','MEDIUM','HIGH') NOT NULL,
  explanation_json JSON NULL,
  model_version VARCHAR(50) DEFAULT 'fallback-v1',

  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  CONSTRAINT fk_sme_scores_sme
    FOREIGN KEY (sme_id) REFERENCES smes(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  INDEX idx_sme_scores_sme_id (sme_id),
  INDEX idx_sme_scores_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;