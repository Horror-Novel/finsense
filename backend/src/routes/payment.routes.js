const express = require("express");
const { getPlan, createOrder, verifyPayment, activateTestProHandler } = require("../controllers/payment.controller");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

router.get("/plan", getPlan);
router.post("/create-order", createOrder);
router.post("/verify", verifyPayment);
router.post("/activate-test-pro", activateTestProHandler);

module.exports = router;
