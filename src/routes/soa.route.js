const express = require("express");
const router = express.Router();

const soaController = require("../controllers/soa.controller");
const authenticate = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const { upload } = require("../middleware/upload.middleware");

router.post("/upload", authenticate, authorize("sme"), upload.single("file"), soaController.uploadSOA);

module.exports = router;