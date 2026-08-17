const express = require("express");
const {
  getTransactions,
  getSummary,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} = require("../controllers/transactions.controller");
const { requireAuth } = require("../middleware/auth");
const { llmRateLimiter } = require("../middleware/rateLimiter");
const validate = require("../middleware/validate");
const { upload, attachReceiptUrl } = require("../middleware/upload");
const {
  createTransactionSchema,
  updateTransactionSchema,
} = require("../validators/transaction.validator");

const router = express.Router();

router.use(requireAuth);

router.get("/", getTransactions);
router.get("/summary", getSummary);

// Receipt image is optional — field name must be "receipt" on the frontend form
router.post(
  "/",
  llmRateLimiter, // rate-limited because autoCategrize may call the LLM
  upload.single("receipt"),
  attachReceiptUrl,
  validate(createTransactionSchema),
  createTransaction
);

router.patch("/:id", validate(updateTransactionSchema), updateTransaction);
router.delete("/:id", deleteTransaction);

module.exports = router;
