const multer = require("multer");
const path = require("path");
const fs = require("fs");
const ApiError = require("../utils/apiError");

const uploadDir = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// Only allow common image types, and cap size at 5MB, to keep the
// upload endpoint from being abused as a general file-storage service.
const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];

function fileFilter(req, file, cb) {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new ApiError(400, "Only JPEG, PNG, WEBP, or HEIC receipt images are allowed"));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// After multer saves the file, attach a servable URL for the controller to use
function attachReceiptUrl(req, res, next) {
  if (req.file) {
    req.uploadedReceiptUrl = `/uploads/${req.file.filename}`;
  }
  next();
}

module.exports = { upload, attachReceiptUrl };
