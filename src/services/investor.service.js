const db = require("../config/db");

const listSmesWithScores = async (query) => {
  const minScore = query.minScore ? Number(query.minScore) : null;
  const risk = query.risk || null;

  let sql = `
    SELECT 
      s.id AS sme_id,
      s.business_name,
      s.industry,
      s.location,
      s.years_of_operation,
      s.employees,
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

  sql += " ORDER BY sc.score DESC";

  const [rows] = await db.execute(sql, params);
  return { smes: rows };
};

module.exports = { listSmesWithScores };