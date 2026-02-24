const db = require("../config/db");

const uploadSOA = async (userId, file) => {
  if (!file) throw { statusCode: 400, message: "File is required" };

  // find SME profile
  const [smeRows] = await db.execute("SELECT id FROM smes WHERE owner_user_id = ?", [userId]);
  if (smeRows.length === 0) throw { statusCode: 404, message: "Create SME profile first" };

  const smeId = smeRows[0].id;

  let file_type = "csv";
  if (file.mimetype === "application/pdf") file_type = "pdf";
  if (file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") file_type = "xlsx";

  const [result] = await db.execute(
    `INSERT INTO soa_uploads (sme_id, file_name, file_path, file_type, status)
     VALUES (?, ?, ?, ?, 'UPLOADED')`,
    [smeId, file.originalname, file.path, file_type]
  );

  return {
    upload: {
      id: result.insertId,
      sme_id: smeId,
      file_name: file.originalname,
      file_path: file.path,
      file_type,
      status: "UPLOADED"
    }
  };
};

module.exports = { uploadSOA };