const investorService = require("../services/investor.service");

const listSmes = async (req, res) => {
  try {
    const result = await investorService.listSmesWithScores(req.query);
    return res.json(result);
  } catch (err) {
    return res.status(err.statusCode || 500).json({ message: err.message });
  }
};

module.exports = { listSmes };