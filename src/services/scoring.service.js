const axios = require("axios");
const db = require("../config/db");

const computeFallbackScore = (sme) => {
  let score = 50;

  score += Math.min(20, sme.years_of_operation * 2); // up to +20
  score += Math.min(20, Math.floor(sme.employees / 5)); // up to +20

  const industry = String(sme.industry || "").toLowerCase();
  if (["fintech", "health", "agriculture", "logistics"].includes(industry)) score += 5;

  if (score > 100) score = 100;

  const risk_level = score >= 70 ? "LOW" : score >= 40 ? "MEDIUM" : "HIGH";

  const explanation = {
    source: "fallback",
    strengths: [
      `Years of operation contributed positively (${sme.years_of_operation} years)`,
      `Employee size contributed positively (${sme.employees} employees)`
    ],
    risks: score < 70 ? ["Limited available financial parsing in MVP; score based on profile + upload presence"] : [],
    metrics: { years_of_operation: sme.years_of_operation, employees: sme.employees }
  };

  return { score, risk_level, explanation, model_version: "fallback-v1" };
};

const runScoreForSmeUser = async (userId) => {
  // 1) Fetch SME profile
  const [smeRows] = await db.execute(
    "SELECT id, business_name, industry, years_of_operation, employees FROM smes WHERE owner_user_id = ?",
    [userId]
  );
  if (smeRows.length === 0) throw { statusCode: 404, message: "SME profile not found" };

  const sme = smeRows[0];

  // 2) Ensure at least one SOA upload exists
  const [uploads] = await db.execute(
    "SELECT id, file_type, status FROM soa_uploads WHERE sme_id = ? ORDER BY created_at DESC LIMIT 1",
    [sme.id]
  );
  if (uploads.length === 0) throw { statusCode: 400, message: "Upload statement of account first" };

  const aiMode = String(process.env.AI_MODE || "fallback").toLowerCase();
  const timeoutMs = Number(process.env.AI_TIMEOUT_MS || 5000);
  const aiUrl = process.env.AI_SERVICE_URL; 
  // Default: fallback
  let final = computeFallbackScore(sme);

  // 3) Try AI scoring if enabled
  if (aiMode === "external") {
    if (!aiUrl) {
      // No AI URL set -> fallback
      final.explanation = {
        ...final.explanation,
        note: "AI_MODE=external but AI_SERVICE_URL is not set; used fallback scoring."
      };
    } else {
      // Get latest financial summary (AI input features)
      const [finRows] = await db.execute(
        `SELECT revenue, expenses, debt, revenue_growth, reporting_consistency, impact_score
         FROM sme_financial_summary
         WHERE sme_id = ?
         ORDER BY created_at DESC
         LIMIT 1`,
        [sme.id]
      );

      if (finRows.length === 0) {
        // Missing required AI features -> fallback
        final.explanation = {
          ...final.explanation,
          note:
            "AI_MODE=external but financial summary is missing. Add revenue, expenses, debt, revenue_growth, reporting_consistency, impact_score."
        };
      } else {
        const payload = finRows[0]; // must match their FastAPI keys exactly

        try {
          const resp = await axios.post(`${aiUrl}/score`, payload, { timeout: timeoutMs });

          // Their service returns: { credibility_score, credible_class }
          const aiScoreRaw = resp?.data?.credibility_score;
          const credibleClass = resp?.data?.credible_class;

          const aiScore = Number(aiScoreRaw);
          if (Number.isNaN(aiScore)) {
            throw new Error("AI response missing/invalid credibility_score");
          }

          const score = Math.round(aiScore); // keep INT to match your current sme_scores schema
          const risk_level = score >= 70 ? "LOW" : score >= 40 ? "MEDIUM" : "HIGH";

          const explanation = {
            source: "ai-service",
            credible_class: typeof credibleClass === "number" ? credibleClass : Number(credibleClass),
            model_inputs: payload,
            note: "Score generated via external AI scoring service"
          };

          final = { score, risk_level, explanation, model_version: "ai-v1" };
        } catch (err) {
          // AI failed -> fallback
          final = computeFallbackScore(sme);
          final.explanation = {
            ...final.explanation,
            note: "AI service call failed; used fallback scoring instead.",
            ai_error: err?.response?.status
              ? `HTTP ${err.response.status}`
              : err?.message || "unknown error"
          };
        }
      }
    }
  }

  // 4) Save result
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