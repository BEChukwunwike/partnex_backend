const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const signToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
  );
};

const registerUser = async ({ email, password, role }) => {
  if (!email || !password || !role) {
    throw { statusCode: 400, message: "email, password, role are required" };
  }

  const allowedRoles = ["sme", "investor", "admin"];
  if (!allowedRoles.includes(role)) {
    throw { statusCode: 400, message: "role must be sme, investor, or admin" };
  }

  const [existing] = await db.execute("SELECT id FROM users WHERE email = ?", [email]);
  if (existing.length > 0) {
    throw { statusCode: 409, message: "Email already in use" };
  }

  const password_hash = await bcrypt.hash(password, 12);

  const [result] = await db.execute(
    "INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)",
    [email, password_hash, role]
  );

  const user = { id: result.insertId, email, role };
  const token = signToken(user);

  return { user, token };
};

const loginUser = async ({ email, password }) => {
  if (!email || !password) {
    throw { statusCode: 400, message: "email and password are required" };
  }

  const [rows] = await db.execute(
    "SELECT id, email, password_hash, role FROM users WHERE email = ?",
    [email]
  );

  if (rows.length === 0) {
    throw { statusCode: 401, message: "Invalid credentials" };
  }

  const userRow = rows[0];

  const ok = await bcrypt.compare(password, userRow.password_hash);
  if (!ok) {
    throw { statusCode: 401, message: "Invalid credentials" };
  }

  const user = { id: userRow.id, email: userRow.email, role: userRow.role };
  const token = signToken(user);

  return { user, token };
};

module.exports = { registerUser, loginUser };