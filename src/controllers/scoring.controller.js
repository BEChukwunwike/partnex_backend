const scoringService = require("../services/scoring.service");

const runMyScore = async (req, res) => {
  try {
    const result = await scoringService.runScoreForSmeUser(req.user.id);
    return res.status(201).json(result);
  } catch (err) {
    return res.status(err.statusCode || 500).json({ message: err.message });
  }
};

module.exports = { runMyScore };