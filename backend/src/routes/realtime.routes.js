const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { getPusher, userChannel } = require("../config/pusher");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");

const router = express.Router();

// GET /api/realtime/config — tells the browser whether live sync runs
// through Pusher and which public key/cluster to use. The key is public by
// design; the secret never leaves the server.
router.get("/config", (req, res) => {
  const enabled = Boolean(getPusher());
  res.status(200).json({
    success: true,
    data: enabled
      ? { provider: "pusher", key: process.env.PUSHER_KEY.trim(), cluster: process.env.PUSHER_CLUSTER.trim() }
      : { provider: null },
  });
});

// POST /api/realtime/auth — signs a private-channel subscription, but only
// for the logged-in user's own channel.
router.post(
  "/auth",
  requireAuth,
  asyncHandler(async (req, res) => {
    const pusher = getPusher();
    if (!pusher) throw new ApiError(404, "Realtime is not configured");

    const { socket_id: socketId, channel_name: channelName } = req.body || {};
    if (!socketId || channelName !== userChannel(req.user.id)) {
      throw new ApiError(403, "Not allowed to subscribe to this channel");
    }
    res.status(200).json(pusher.authorizeChannel(socketId, channelName));
  })
);

module.exports = router;
