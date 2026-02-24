const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    "text/csv",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ];
  if (!allowed.includes(file.mimetype)) return cb(new Error("Unsupported file type"));
  cb(null, true);
};

const upload = multer({ storage, fileFilter });

module.exports = { upload };