const authService = require("../services/auth.service");

const register = async (req, res) => {
  try {
    const result = await authService.registerUser(req.body);
    return res.status(201).json(result);
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      message: err.message
    });
  }
};

const login = async (req, res) => {
  try {
    const result = await authService.loginUser(req.body);
    return res.json(result);
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      message: err.message
    });
  }
};

module.exports = { register, login };