const db = require("../config/db");

const runScoreForSmeUser = async (userId) => {
  const [smeRows] = await db.execute("SELECT id, business_name, industry, years_of_operation, employees FROM smes WHERE owner_user_id = ?", [userId]);
  if (smeRows.length === 0) throw { statusCode: 404, message: "SME profile not found" };

  const sme = smeRows[0];

  // Ensure at least one upload exists
  const [uploads] = await db.execute("SELECT id, file_type, status FROM soa_uploads WHERE sme_id = ? ORDER BY created_at DESC LIMIT 1", [sme.id]);
  if (uploads.length === 0) throw { statusCode: 400, message: "Upload statement of account first" };

  // MVP scoring (simple, explainable)
  let score = 50;
  score += Math.min(20, sme.years_of_operation * 2);     // up to +20
  score += Math.min(20, Math.floor(sme.employees / 5));  // up to +20
  if (["fintech", "health", "agriculture", "logistics"].includes(String(sme.industry).toLowerCase())) score += 5;

  if (score > 100) score = 100;

  const risk_level = score >= 70 ? "LOW" : score >= 40 ? "MEDIUM" : "HIGH";

  const explanation = {
    strengths: [
      `Years of operation contributed positively (${sme.years_of_operation} years)`,
      `Employee size contributed positively (${sme.employees} employees)`
    ],
    risks: score < 70 ? ["Limited available financial parsing in MVP; score based on profile + upload presence"] : [],
    metrics: { years_of_operation: sme.years_of_operation, employees: sme.employees }
  };

  const [result] = await db.execute(
    `INSERT INTO sme_scores (sme_id, score, risk_level, explanation_json, model_version)
     VALUES (?, ?, ?, ?, 'v1')`,
    [sme.id, score, risk_level, JSON.stringify(explanation)]
  );

  return { sme_id: sme.id, score_id: result.insertId, score, risk_level, explanation };
};

module.exports = { runScoreForSmeUser };