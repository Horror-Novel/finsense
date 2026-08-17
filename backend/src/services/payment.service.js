const Razorpay = require("razorpay");
const crypto = require("crypto");
const prisma = require("../config/prisma");

// Razorpay client — instantiated lazily so the app boots even if the
// keys aren't set (payment features just return 503 in that case).
function getRazorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return null;
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

// Pro plan pricing — ₹299/month, billed as a one-time order per month.
// Razorpay amounts are always in the currency's smallest unit (paise for INR).
const PRO_AMOUNT_PAISE = 29900; // ₹299
const PRO_CURRENCY = "INR";

// Step 1: create a Razorpay order when the user clicks "Upgrade to Pro".
// Returns the order object whose `id` is needed by the frontend Razorpay
// checkout SDK to open the payment modal.
async function createProOrder(userId) {
  const razorpay = getRazorpay();
  if (!razorpay) {
    throw new Error("Payment gateway not configured on this server");
  }

  const order = await razorpay.orders.create({
    amount: PRO_AMOUNT_PAISE,
    currency: PRO_CURRENCY,
    receipt: `pro_${userId}_${Date.now()}`,
    notes: { userId: String(userId), plan: "PRO" },
  });

  // Persist the pending subscription so we can match the webhook to it later
  await prisma.subscription.create({
    data: {
      userId,
      razorpayOrderId: order.id,
      amount: PRO_AMOUNT_PAISE,
      currency: PRO_CURRENCY,
      status: "PENDING",
      plan: "PRO",
    },
  });

  return { orderId: order.id, amount: PRO_AMOUNT_PAISE, currency: PRO_CURRENCY };
}

// Step 2: verify the payment on the backend BEFORE activating Pro.
// Razorpay sends the client a `razorpay_payment_id` and a `razorpay_signature`
// after a successful payment; we re-compute the expected signature using our
// KEY_SECRET and reject anything that doesn't match — this is what makes the
// verification cryptographically safe rather than trust-the-client.
async function verifyAndActivatePro(userId, { razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new Error("Payment gateway not configured");

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  if (expected !== razorpaySignature) {
    throw new Error("Payment signature verification failed");
  }

  // Signature valid — mark the subscription paid and upgrade the user
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // +30 days

  await prisma.$transaction([
    prisma.subscription.update({
      where: { razorpayOrderId },
      data: { razorpayPaymentId, status: "PAID", expiresAt },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { plan: "PRO" },
    }),
  ]);

  return { plan: "PRO", expiresAt };
}

// TEST BYPASS — activates Pro for the logged-in user immediately without
// any real payment. Only works when NODE_ENV !== "production".
// This is the answer to "how do I test Pro without paying".
async function activateTestPro(userId) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Test Pro activation is not available in production");
  }

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.subscription.create({
      data: {
        userId,
        razorpayOrderId: `test_${userId}_${Date.now()}`,
        amount: 0,
        currency: "INR",
        status: "PAID",
        plan: "PRO",
        expiresAt,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { plan: "PRO" },
    }),
  ]);

  return { plan: "PRO", expiresAt, note: "Test activation — no real payment was made" };
}

// Utility: check whether a given user currently has an active Pro plan.
async function isProUser(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });
  if (user?.plan !== "PRO") return false;

  // Also verify they have at least one non-expired paid subscription
  const active = await prisma.subscription.findFirst({
    where: {
      userId,
      status: "PAID",
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });
  return !!active;
}

module.exports = { createProOrder, verifyAndActivatePro, activateTestPro, isProUser, PRO_AMOUNT_PAISE };
