const express = require("express");
const router = express.Router();

const scoringController = require("../controllers/scoring.controller");
const authenticate = require("../middleware/auth");
const authorize = require("../middleware/authorize");

router.post("/run", authenticate, authorize("sme"), scoringController.runMyScore);

module.exports = router;