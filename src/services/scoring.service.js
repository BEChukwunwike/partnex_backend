const axios = require("axios");
const db = require("../config/db");

const clamp = (num, min, max) => Math.max(min, Math.min(max, num));

const computeFallbackScore = (sme) => {
  let score = 50;

  score += Math.min(20, sme.years_of_operation * 2); // up to +20
  score += Math.min(20, Math.floor(sme.number_of_employees / 5)); // up to +20

  const industry = String(sme.industry_sector || "").toLowerCase();
  if (["fintech", "health", "agriculture", "logistics"].includes(industry)) score += 5;

  score = clamp(score, 0, 100);

  const risk_level = score >= 70 ? "LOW" : score >= 40 ? "MEDIUM" : "HIGH";

  const explanation = {
    source: "fallback",
    strengths: [
      `Years of operation contributed positively (${sme.years_of_operation} years)`,
      `Employee size contributed positively (${sme.number_of_employees} employees)`
    ],
    risks: score < 70 ? ["MVP fallback score based on profile data only."] : [],
    metrics: {
      years_of_operation: sme.years_of_operation,
      number_of_employees: sme.number_of_employees,
      industry_sector: sme.industry_sector
    }
  };

  return { score, risk_level, explanation, model_version: "fallback-v1" };
};

const buildAiPayloadFromSme = (sme) => {
  // Revenue: choose latest available annual revenue (year 3 optional)
  const revenueLatest =
    sme.annual_revenue_amount_3 != null ? Number(sme.annual_revenue_amount_3) : Number(sme.annual_revenue_amount_2);

  // Revenue growth: prefer year2 vs year1; if year3 exists, you can use year3 vs year2
  let revenue_growth = 0;
  const y1 = Number(sme.annual_revenue_amount_1);
  const y2 = Number(sme.annual_revenue_amount_2);
  const y3 = sme.annual_revenue_amount_3 != null ? Number(sme.annual_revenue_amount_3) : null;

  if (y3 != null && y2 > 0) revenue_growth = (y3 - y2) / y2;
  else if (y1 > 0) revenue_growth = (y2 - y1) / y1;

  // Reporting consistency: simple MVP proxy
  const has2Years = sme.annual_revenue_amount_1 != null && sme.annual_revenue_amount_2 != null;
  const has3Years = has2Years && sme.annual_revenue_amount_3 != null;
  const reporting_consistency = has3Years ? 0.95 : has2Years ? 0.9 : 0.7;

  // Expenses + Debt
  const expenses = Number(sme.monthly_expenses); // keep as monthly (matches your PRD)
  const debt = Number(sme.existing_liabilities);

  // Impact score: not in PRD 6.2, so we default for MVP
  const impact_score = 0.7;

  return {
    revenue: revenueLatest,
    expenses,
    debt,
    revenue_growth: Number.isFinite(revenue_growth) ? revenue_growth : 0,
    reporting_consistency,
    impact_score
  };
};

const runScoreForSmeUser = async (userId) => {
  // 1) Fetch SME profile with PRD columns
  const [smeRows] = await db.execute(
    `SELECT 
        id,
        business_name,
        industry_sector,
        location,
        years_of_operation,
        number_of_employees,
        annual_revenue_amount_1,
        annual_revenue_amount_2,
        annual_revenue_amount_3,
        monthly_expenses,
        existing_liabilities
     FROM smes
     WHERE owner_user_id = ?`,
    [userId]
  );

  if (smeRows.length === 0) throw { statusCode: 404, message: "SME profile not found" };

  const sme = smeRows[0];

  // Default: fallback
  let final = computeFallbackScore(sme);

  const aiMode = String(process.env.AI_MODE || "fallback").toLowerCase();
  const timeoutMs = Number(process.env.AI_TIMEOUT_MS || 5000);
  const aiUrl = process.env.AI_SERVICE_URL;

  // 2) Try AI scoring if enabled
  if (aiMode === "external") {
    if (!aiUrl) {
      final.explanation = {
        ...final.explanation,
        note: "AI_MODE=external but AI_SERVICE_URL is not set; used fallback scoring."
      };
    } else {
      const payload = buildAiPayloadFromSme(sme);

      // Basic validation to avoid sending junk to AI service
      const missing = [];
      ["revenue", "expenses", "debt", "revenue_growth", "reporting_consistency", "impact_score"].forEach((k) => {
        if (payload[k] == null || Number.isNaN(Number(payload[k]))) missing.push(k);
      });

      if (missing.length > 0) {
        final.explanation = {
          ...final.explanation,
          note: `AI_MODE=external but required AI inputs are missing/invalid: ${missing.join(", ")}. Used fallback.`
        };
      } else {
        try {
          const resp = await axios.post(`${aiUrl}/score`, payload, { timeout: timeoutMs });

          const aiScoreRaw = resp?.data?.credibility_score;
          const credibleClass = resp?.data?.credible_class;

          const aiScore = Number(aiScoreRaw);
          if (Number.isNaN(aiScore)) throw new Error("AI response missing/invalid credibility_score");

          const score = clamp(aiScore, 0, 100);
          const risk_level = score >= 70 ? "LOW" : score >= 40 ? "MEDIUM" : "HIGH";

          final = {
            score,
            risk_level,
            explanation: {
              source: "ai-service",
              credible_class: typeof credibleClass === "number" ? credibleClass : Number(credibleClass),
              model_inputs: payload,
              note: "Score generated via external AI scoring service using PRD 6.2 profile inputs"
            },
            model_version: "ai-v1"
          };
        } catch (err) {
          final = computeFallbackScore(sme);
          final.explanation = {
            ...final.explanation,
            note: "AI service call failed; used fallback scoring instead.",
            ai_error: err?.response?.status ? `HTTP ${err.response.status}` : err?.message || "unknown error"
          };
        }
      }
    }
  }

  // 3) Save result
  const [result] = await db.execute(
    `INSERT INTO sme_scores (sme_id, score, risk_level, explanation_json, model_version)
     VALUES (?, ?, ?, ?, ?)`,
    [sme.id, final.score, final.risk_level, JSON.stringify(final.explanation), final.model_version]
  );

  return {
    sme_id: sme.id,
    score_id: result.insertId,
    score: final.score,
    risk_level: final.risk_level,
    explanation: final.explanation,
    model_version: final.model_version
  };
};

module.exports = { runScoreForSmeUser };