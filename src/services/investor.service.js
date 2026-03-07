const db = require("../config/db");

const listSmesWithScores = async (query) => {
    // Validate minScore
let minScore = null;
if (query.minScore !== undefined) {
  const n = Number(query.minScore);
  if (!Number.isFinite(n)) {
    throw { statusCode: 400, message: "minScore must be a valid number" };
  }
  minScore = n;
}

 // Validate risk
  let risk = null;
  if (query.risk) {
    const r = String(query.risk).trim().toUpperCase();
    const allowed = new Set(["LOW", "MEDIUM", "HIGH"]);
    if (!allowed.has(r)) {
      throw { statusCode: 400, message: "risk must be LOW, MEDIUM, or HIGH" };
    }
    risk = r;
  }

   // Pagination
  const rawLimit = Number(query.limit ?? 50);
  const rawOffset = Number(query.offset ?? 0);

  if (!Number.isFinite(rawLimit) || rawLimit < 1) {
    throw { statusCode: 400, message: "limit must be a positive number" };
  }

  if (!Number.isFinite(rawOffset) || rawOffset < 0) {
    throw { statusCode: 400, message: "offset must be zero or a positive number" };
  }

  const limit = Math.min(rawLimit, 100);
  const offset = rawOffset;

  let sql = `
    SELECT 
      s.id AS sme_id,
      s.business_name,
      s.industry_sector AS industry,
      s.location,
      s.years_of_operation,
      s.number_of_employees AS employees,
      sc.score,
      sc.risk_level,
      sc.created_at AS scored_at
    FROM smes s
    LEFT JOIN (
      SELECT t1.*
      FROM sme_scores t1
      INNER JOIN (
        SELECT sme_id, MAX(created_at) AS max_created
        FROM sme_scores
        GROUP BY sme_id
      ) t2 ON t1.sme_id = t2.sme_id AND t1.created_at = t2.max_created
    ) sc ON sc.sme_id = s.id
    WHERE 1=1
  `;

  const params = [];

  if (minScore !== null) {
    sql += " AND (sc.score IS NOT NULL AND sc.score >= ?)";
    params.push(minScore);
  }
  

  if (risk) {
    sql += " AND sc.risk_level = ?";
    params.push(risk);
  }

 // Unscored SMEs last, highest scores first
  sql += " ORDER BY (sc.score IS NULL), sc.score DESC";
  sql += " LIMIT ? OFFSET ?";
  params.push(limit, offset);

  const [rows] = await db.execute(sql, params);
  return {
  smes: rows,
  meta: {
    limit,
    offset,
    count: rows.length
  }
};
};

module.exports = { listSmesWithScores };