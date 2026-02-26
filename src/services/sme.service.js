const db = require("../config/db");

const createProfile = async (userId, payload) => {
  const {
    business_name,
    industry_sector,
    location,
    years_of_operation,
    number_of_employees,

    annual_revenue_year_1,
    annual_revenue_amount_1,
    annual_revenue_year_2,
    annual_revenue_amount_2,
    annual_revenue_year_3,
    annual_revenue_amount_3,

    monthly_revenue,
    monthly_expenses,
    existing_liabilities,

    prior_funding_history,
    repayment_history
  } = payload;

  // PRD 6.2 required fields
  const missing = [];
  const required = {
    business_name,
    industry_sector,
    location,
    years_of_operation,
    number_of_employees,
    annual_revenue_year_1,
    annual_revenue_amount_1,
    annual_revenue_year_2,
    annual_revenue_amount_2,
    monthly_expenses,
    existing_liabilities,
    prior_funding_history
  };

  for (const [k, v] of Object.entries(required)) {
    if (v === undefined || v === null || v === "") missing.push(k);
  }

  if (missing.length > 0) {
    throw { statusCode: 400, message: `Missing required SME fields: ${missing.join(", ")}` };
  }

  // If year 3 is used, both year and amount must be provided
  const y3Provided = annual_revenue_year_3 != null || annual_revenue_amount_3 != null;
  if (y3Provided && (annual_revenue_year_3 == null || annual_revenue_amount_3 == null)) {
    throw { statusCode: 400, message: "annual_revenue_year_3 and annual_revenue_amount_3 must be provided together" };
  }

  // prevent duplicates: one SME profile per user
  const [existing] = await db.execute("SELECT id FROM smes WHERE owner_user_id = ?", [userId]);
  if (existing.length > 0) {
    throw { statusCode: 409, message: "SME profile already exists for this user" };
  }

  const [result] = await db.execute(
    `INSERT INTO smes (
      owner_user_id,
      business_name,
      industry_sector,
      location,
      years_of_operation,
      number_of_employees,
      annual_revenue_year_1,
      annual_revenue_amount_1,
      annual_revenue_year_2,
      annual_revenue_amount_2,
      annual_revenue_year_3,
      annual_revenue_amount_3,
      monthly_revenue,
      monthly_expenses,
      existing_liabilities,
      prior_funding_history,
      repayment_history
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      business_name,
      industry_sector,
      location,
      Number(years_of_operation),
      Number(number_of_employees),

      Number(annual_revenue_year_1),
      Number(annual_revenue_amount_1),

      Number(annual_revenue_year_2),
      Number(annual_revenue_amount_2),

      annual_revenue_year_3 != null ? Number(annual_revenue_year_3) : null,
      annual_revenue_amount_3 != null ? Number(annual_revenue_amount_3) : null,

      monthly_revenue != null ? Number(monthly_revenue) : null,
      Number(monthly_expenses),
      Number(existing_liabilities),

      String(prior_funding_history),
      repayment_history != null ? String(repayment_history) : null
    ]
  );

  return {
    sme: {
      id: result.insertId,
      owner_user_id: userId,
      business_name,
      industry_sector,
      location,
      years_of_operation: Number(years_of_operation),
      number_of_employees: Number(number_of_employees),
      annual_revenue_year_1: Number(annual_revenue_year_1),
      annual_revenue_amount_1: Number(annual_revenue_amount_1),
      annual_revenue_year_2: Number(annual_revenue_year_2),
      annual_revenue_amount_2: Number(annual_revenue_amount_2),
      annual_revenue_year_3: annual_revenue_year_3 != null ? Number(annual_revenue_year_3) : null,
      annual_revenue_amount_3: annual_revenue_amount_3 != null ? Number(annual_revenue_amount_3) : null,
      monthly_revenue: monthly_revenue != null ? Number(monthly_revenue) : null,
      monthly_expenses: Number(monthly_expenses),
      existing_liabilities: Number(existing_liabilities),
      prior_funding_history: String(prior_funding_history),
      repayment_history: repayment_history != null ? String(repayment_history) : null
    }
  };
};

const getMyProfile = async (userId) => {
  const [rows] = await db.execute("SELECT * FROM smes WHERE owner_user_id = ?", [userId]);
  if (rows.length === 0) throw { statusCode: 404, message: "SME profile not found" };
  return { sme: rows[0] };
};

module.exports = { createProfile, getMyProfile };