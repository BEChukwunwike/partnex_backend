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

---

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

---

## Architecture

Frontend (future)
        ↓
Node Backend (Render)
        ↓
AWS RDS (Database)
        ↓
AI Scoring Service (FastAPI on Render)

The backend communicates with the AI service via HTTP using Axios.

---

## Environment Variables

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
AI_MODE=external # external or fallback


---

## Database Schema

### Users
- id
- email
- password_hash
- role (sme, investor, admin)

### SMEs
- owner_user_id
- business_name
- industry
- location
- years_of_operation
- employees

### Investors
- owner_user_id
- full_name
- organization
- location

### SOA Uploads
- sme_id
- file_name
- file_path
- file_type
- status

### SME Scores
- sme_id
- score
- risk_level
- explanation_json
- model_version
- created_at

### SME Financial Summary (AI Inputs)
- revenue
- expenses
- debt
- revenue_growth
- reporting_consistency
- impact_score

---

## Authentication

All protected routes require:


Authorization: Bearer <JWT_TOKEN>


---

## API Endpoints

### Health Check

GET /

---

### Register

POST /auth/register

```json
{
  "email": "user@test.com",
  "password": "Password123",
  "role": "sme"
}
Login

POST /auth/login

Create SME Profile

POST /sme/profile

Requires SME role.

Upload Statement of Account

POST /api/soa/upload

Form-data:

file

Add Financial Summary (AI Input)

POST /api/sme/financial-summary

{
  "revenue": 1200000,
  "expenses": 800000,
  "debt": 200000,
  "revenue_growth": 0.12,
  "reporting_consistency": 0.9,
  "impact_score": 0.7
}
Run Credibility Score

POST /api/score/run

Returns:

{
  "sme_id": 1,
  "score": 78,
  "risk_level": "LOW",
  "model_version": "ai-v1"
}

If AI service fails, system falls back to rule-based scoring.

Investor View SMEs

GET /api/investor/smes

Returns latest score per SME.

AI Integration

The backend integrates with an external AI scoring microservice.

When AI_MODE=external:

Backend fetches latest financial summary.

Sends data to AI service.

Receives:

credibility_score

credible_class

Saves result in sme_scores.

If AI service is unavailable, fallback scoring logic is used.

Deployment

Backend hosted on Render:
https://partnex-backend.onrender.com

Database hosted on AWS RDS.

AI service hosted separately on Render.

Security

Passwords hashed using bcrypt

JWT authentication

Helmet for HTTP security

Express rate limiting

Role-based authorization middleware

Environment-based configuration