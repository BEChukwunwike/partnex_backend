const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const smeController = require("../controllers/sme.controller");

router.post("/profile", authenticate, authorize("sme"), smeController.createProfile);

module.exports = router;