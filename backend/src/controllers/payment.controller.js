const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const prisma = require("../config/prisma");
const {
  createProOrder,
  verifyAndActivatePro,
  activateTestPro,
  PRO_AMOUNT_PAISE,
} = require("../services/payment.service");

// GET /api/payments/plan — returns the user's current plan + subscription history
const getPlan = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { plan: true },
  });

  const subscriptions = await prisma.subscription.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const active = subscriptions.find(
    (s) => s.status === "PAID" && (!s.expiresAt || s.expiresAt > new Date())
  );

  res.status(200).json({
    success: true,
    plan: user?.plan || "FREE",
    expiresAt: active?.expiresAt || null,
    proAmountInr: PRO_AMOUNT_PAISE / 100,
    subscriptions,
  });
});

// POST /api/payments/create-order — Step 1 of checkout: creates a Razorpay order
const createOrder = asyncHandler(async (req, res) => {
  if (!process.env.RAZORPAY_KEY_ID) {
    throw new ApiError(503, "Currently we are not accepting new subscriptions.");
  }

  const result = await createProOrder(req.user.id);
  res.status(201).json({
    success: true,
    ...result,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
  });
});

// POST /api/payments/verify — Step 2: verify Razorpay signature and activate Pro
// Body: { razorpayOrderId, razorpayPaymentId, razorpaySignature }
const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw new ApiError(400, "Missing payment verification fields");
  }

  const result = await verifyAndActivatePro(req.user.id, {
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  });

  res.status(200).json({ success: true, ...result });
});

// POST /api/payments/activate-test-pro
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HOW TO TEST PRO FEATURES WITHOUT PAYING:
//
// This endpoint bypasses the Razorpay payment flow entirely and
// immediately upgrades your account to Pro, valid for 30 days.
//
// Run this from a terminal (replace YOUR_TOKEN with the JWT from
// localStorage.getItem('finsense_token') in browser dev tools):
//
//   curl -X POST http://localhost:5000/api/payments/activate-test-pro \
//     -H "Authorization: Bearer YOUR_TOKEN"
//
// Or just click the "Activate Test Pro" button shown on the Pricing page
// when NODE_ENV=development (it's hidden in production).
//
// Only works when NODE_ENV !== 'production'.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const activateTestProHandler = asyncHandler(async (req, res) => {
  const result = await activateTestPro(req.user.id);
  res.status(200).json({ success: true, ...result });
});

module.exports = { getPlan, createOrder, verifyPayment, activateTestProHandler };
