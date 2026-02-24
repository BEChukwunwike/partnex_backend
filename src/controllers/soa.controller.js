const soaService = require("../services/soa.service");

const uploadSOA = async (req, res) => {
  try {
    const result = await soaService.uploadSOA(req.user.id, req.file);
    return res.status(201).json(result);
  } catch (err) {
    return res.status(err.statusCode || 500).json({ message: err.message });
  }
};

module.exports = { uploadSOA };