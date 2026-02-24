Partnex Backend API

Partnex Backend is a role-based fintech REST API designed to support SME credibility scoring and investor decision-making.

Built as part of a Capstone Project aligned with SDG 17 – Partnerships for the Goals.


Overview

The system enables:

SMEs to register and create business profiles

SMEs to upload financial statements (SOA)

Automated credibility scoring

Investors to securely view SMEs and their risk levels

Role-based access control (RBAC) enforcement

The architecture is designed to support seamless integration with an external AI scoring microservice.


Tech Stack

Node.js

Express

MySQL (mysql2/promise)

JWT Authentication

Multer (File Uploads)

Axios (AI integration ready)

Helmet & Rate Limiting (Security)


 User Roles
Role	Capabilities
SME	Create profile, upload statement, run scoring
Investor	View SMEs and credibility scores
Admin	Reserved for system oversight

Project Structure
partnex_backend/
│
├── database/
│   └── schema.sql
│
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   └── app.js
│
├── server.js
├── package.json
├── .gitignore
└── README.md


Setup Instructions

1️⃣ Clone Repository
git clone https://github.com/BEChukwunwike/partnex_backend.git
cd partnex_backend

2️⃣ Install Dependencies
npm install

3️⃣ Create Environment File

Create a .env file in the root directory:

PORT=3000
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=1d

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=partnex_db


4️⃣ Set Up Database

Run the SQL script located at:

database/schema.sql

5️⃣ Start Development Server
npm run dev

Server runs on:

http://localhost:3000


🧪 MVP Flow (API Demo)
🔹 1. Register SME

POST /api/auth/register

{
  "email": "sme@test.com",
  "password": "Password123!",
  "role": "sme"
}
🔹 2. Login

POST /api/auth/login

Returns JWT token.

🔹 3. Create SME Profile

POST /api/sme/profile

Authorization: Bearer Token

{
  "business_name": "Blessing Foods Ltd",
  "industry": "Agriculture",
  "location": "Abuja",
  "years_of_operation": 3,
  "employees": 12
}
🔹 4. Upload Statement of Account

POST /api/soa/upload

Body: form-data

Key: file

Authorization required

🔹 5. Run Credibility Scoring

POST /api/score/run

Returns:

{
  "score": 63,
  "risk_level": "MEDIUM",
  "explanation": { }
}
🔹 6. Investor View SMEs

GET /api/investor/smes

Returns list of SMEs with latest score.


🧠 Scoring Engine

The scoring engine:

Supports AI microservice integration via REST

Stores model version

Persists explanation metadata

Includes fallback scoring logic for system resilience


🛡️ Security Features

JWT Authentication

Role-Based Access Control (RBAC)

Rate Limiting

Helmet Security Headers

Parameterized SQL Queries

Controlled File Upload Handling


📈 Future Enhancements

Full AI model integration

Financial statement parsing

Audit logging

Admin dashboard

Advanced risk analytics


Author

Blessing Chukwunwike
Backend Development – Partnex Capstone Project