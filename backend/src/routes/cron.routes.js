const express = require("express");
const { runDailyDigestJob } = require("../services/cron.service");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");

const router = express.Router();

// GET /api/cron/daily-digest — called by Vercel Cron (see vercel.json), which
// replaces the in-process node-cron schedule on serverless. Vercel sends
// "Authorization: Bearer <CRON_SECRET>" when CRON_SECRET is set.
router.get(
  "/daily-digest",
  asyncHandler(async (req, res) => {
    const secret = process.env.CRON_SECRET;
    if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
      throw new ApiError(401, "Unauthorized");
    }
    await runDailyDigestJob();
    res.status(200).json({ success: true, message: "Daily digest job finished" });
  })
);

module.exports = router;
