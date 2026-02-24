const db = require("../config/db");

const createProfile = async (userId, payload) => {
  const { business_name, industry, location, years_of_operation, employees } = payload;

  if (!business_name || !industry || !location || years_of_operation == null || employees == null) {
    throw { statusCode: 400, message: "business_name, industry, location, years_of_operation, employees are required" };
  }

  // prevent duplicates: one SME profile per user
  const [existing] = await db.execute(
    "SELECT id FROM smes WHERE owner_user_id = ?",
    [userId]
  );

  if (existing.length > 0) {
    throw { statusCode: 409, message: "SME profile already exists for this user" };
  }

  const [result] = await db.execute(
    `INSERT INTO smes (owner_user_id, business_name, industry, location, years_of_operation, employees)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, business_name, industry, location, Number(years_of_operation), Number(employees)]
  );

  return {
    sme: {
      id: result.insertId,
      owner_user_id: userId,
      business_name,
      industry,
      location,
      years_of_operation: Number(years_of_operation),
      employees: Number(employees),
    }
  };
};
const getMyProfile = async (userId) => {
  const [rows] = await db.execute("SELECT * FROM smes WHERE owner_user_id = ?", [userId]);
  if (rows.length === 0) throw { statusCode: 404, message: "SME profile not found" };
  return { sme: rows[0] };
};
module.exports = { createProfile, getMyProfile };