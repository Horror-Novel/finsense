const Digest = require("../models/Digest");
const prisma = require("../config/prisma");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const { generateDigestForUser } = require("../services/cron.service");

// GET /api/digests — list this user's past digests (newest first)
const getDigests = asyncHandler(async (req, res) => {
  const digests = await Digest.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(30);
  res.status(200).json({ success: true, data: digests });
});

// POST /api/digests/run-now — manually trigger a digest for the logged-in
// user right now, instead of waiting for the 08:00 cron job. This exists
// specifically so the feature is demoable in a viva without waiting a day.
const runDigestNow = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) throw new ApiError(404, "User not found");

  const digest = await generateDigestForUser(user, "manual");

  res.status(201).json({
    success: true,
    data: digest,
    message: digest ? "Digest generated" : "No transactions in the last 24 hours to summarize",
  });
});

module.exports = { getDigests, runDigestNow };
