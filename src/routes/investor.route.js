const express = require("express");
const router = express.Router();

const investorController = require("../controllers/investor.controller");
const authenticate = require("../middleware/auth");
const authorize = require("../middleware/authorize");

router.get("/smes", authenticate, authorize("investor"), investorController.listSmes);

module.exports = router;