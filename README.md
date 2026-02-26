# Partnex Backend API

## Overview

Partnex is a FinTech platform built under SDG 17 (Partnerships for the Goals) to enable transparent funding between SMEs and Investors.

This backend provides:

- Role-based authentication (SME, Investor, Admin)
- SME profile management
- Investor profile management
- Statement of Account (SOA) uploads
- AI-powered SME credibility scoring
- Investor access to SME credibility data
- Secure deployment with environment configuration

Production URL:
https://partnex-backend.onrender.com


## Tech Stack

- Node.js
- Express.js
- MySQL (AWS RDS)
- JWT Authentication
- Axios (AI integration)
- Multer (file uploads)
- Render (deployment)

AI Service:
- FastAPI
- Scikit-learn model
- Hosted separately on Render


## Architecture

Frontend (future)
        ↓
Node Backend (Render)
        ↓
AWS RDS (Database)
        ↓
AI Scoring Service (FastAPI on Render)

The backend communicates with the AI service via HTTP using Axios.


## Environment Variable

The following environment variables must be configured:

DB_HOST=
DB_PORT=3306
DB_USER=
DB_PASS=
DB_NAME=

JWT_SECRET=
JWT_EXPIRES_IN=1d

AI_SERVICE_URL=
AI_TIMEOUT_MS=5000
AI_MODE=external   # external or fallback

## Database Schema

Users
id
email
password_hash
role (sme, investor, admin)
created_at
updated_at

SMEs
Core Business Data:
owner_user_id
business_name
industry_sector
location
years_of_operation
number_of_employees
Annual Revenue (2 required, 1 optional):
annual_revenue_year_1
annual_revenue_amount_1
annual_revenue_year_2
annual_revenue_amount_2
annual_revenue_year_3 (optional)
annual_revenue_amount_3 (optional)
Financial Data:
monthly_revenue (optional)
monthly_expenses
existing_liabilities
History:
prior_funding_history
repayment_history (optional)

## Investors

owner_user_id
full_name
organization
location

## SME Scores

sme_id
score
risk_level (LOW, MEDIUM, HIGH)
explanation_json
model_version
created_at

## Authentication

All protected routes require:
Authorization: Bearer <JWT_TOKEN>
JWT tokens are issued on login and registration.

## API Endpoints

### Health Check
GET /

### Register
POST /api/auth/register
{
  "email": "user@test.com",
  "password": "Password123",
  "role": "sme"
}
### Login
POST /api/auth/login

### Create / Update SME Profile
POST /api/sme/profile

Requires SME role.

Example body:

{
  "business_name": "Blessing Foods Ltd",
  "industry_sector": "Agriculture",
  "location": "Abuja",
  "years_of_operation": 3,
  "number_of_employees": 12,

  "annual_revenue_year_1": 2023,
  "annual_revenue_amount_1": 3500000,
  "annual_revenue_year_2": 2024,
  "annual_revenue_amount_2": 4800000,
  "annual_revenue_year_3": 2025,
  "annual_revenue_amount_3": 5200000,

  "monthly_revenue": 450000,
  "monthly_expenses": 250000,
  "existing_liabilities": 200000,

  "prior_funding_history": "Bank loan of 500k in 2024",
  "repayment_history": "No missed repayments"
}

### Get My SME Profile
GET /api/sme/me

### Run Credibility Score
POST /api/score/run

Returns:

{
  "sme_id": 1,
  "score": 78.42,
  "risk_level": "LOW",
  "model_version": "ai-v1"
}

If AI service fails, system falls back to rule-based scoring:

{
  "model_version": "fallback-v1"
}

### Investor: View Scored SMEs
GET /api/investor/smes

Returns the latest score per SME.

AI Integration

When AI_MODE=external:

Backend extracts financial data from SME profile
Constructs AI payload:
revenue
expenses
debt
revenue_growth
reporting_consistency
impact_score
Sends POST request to external FastAPI service
Receives:
credibility_score
credible_class
Stores result in sme_scores
If AI fails or is unreachable:
Backend automatically uses fallback scoring logic.

## Security

Passwords hashed using bcrypt

JWT authentication

Role-based authorization middleware

Helmet for HTTP security headers

Express rate limiting

Environment-based configuration

## Deployment

Backend hosted on Render:
https://partnex-backend.onrender.com

Database hosted on AWS RDS.

AI microservice hosted separately on Render.