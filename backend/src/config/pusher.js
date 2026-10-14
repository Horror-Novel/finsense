const Pusher = require("pusher");

// Hosted realtime channel used for live sync on Vercel, where Socket.io
// can't run. Enabled only when all four PUSHER_* variables are set.
let pusher = null;

function getPusher() {
  if (pusher) return pusher;
  const { PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER } = process.env;
  if (!PUSHER_APP_ID || !PUSHER_KEY || !PUSHER_SECRET || !PUSHER_CLUSTER) return null;
  pusher = new Pusher({
    appId: PUSHER_APP_ID.trim(),
    key: PUSHER_KEY.trim(),
    secret: PUSHER_SECRET.trim(),
    cluster: PUSHER_CLUSTER.trim(),
    useTLS: true,
  });
  return pusher;
}

// Each user gets their own private channel, mirroring the per-user
// Socket.io room, so events only ever reach that user's tabs.
function userChannel(userId) {
  return `private-user-${userId}`;
}

module.exports = { getPusher, userChannel };
