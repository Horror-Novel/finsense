const multer = require("multer");
const path = require("path");
const fs = require("fs");
const ApiError = require("../utils/apiError");

// Two storage modes:
// - Local / Docker: receipts are written to backend/uploads and served by
//   Express at /uploads/<file>.
// - Vercel: the function filesystem is read-only and not shared between
//   invocations, so receipts are uploaded to Vercel Blob instead (enabled
//   by connecting a Blob store, which sets BLOB_READ_WRITE_TOKEN).
const useBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const isServerless = Boolean(process.env.VERCEL);

const uploadDir = path.join(__dirname, "..", "..", "uploads");

let storage;
if (useBlob || isServerless) {
  storage = multer.memoryStorage();
} else {
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, uniqueName(file.originalname)),
  });
}

function uniqueName(originalname) {
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  return `${uniqueSuffix}${path.extname(originalname)}`;
}

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
  limits: { fileSize: 4 * 1024 * 1024 }, // 4MB (Vercel caps request bodies at 4.5MB)
});

// After multer handles the file, attach a servable URL for the controller to use
async function attachReceiptUrl(req, res, next) {
  if (!req.file) return next();

  if (req.file.path) {
    req.uploadedReceiptUrl = `/uploads/${req.file.filename}`;
    return next();
  }

  if (!useBlob) {
    console.warn("⚠️  Receipt not stored: set BLOB_READ_WRITE_TOKEN to enable uploads on Vercel");
    return next();
  }

  try {
    const { put } = require("@vercel/blob");
    const blob = await put(`receipts/${uniqueName(req.file.originalname)}`, req.file.buffer, {
      access: "public",
      contentType: req.file.mimetype,
    });
    req.uploadedReceiptUrl = blob.url;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { upload, attachReceiptUrl };
