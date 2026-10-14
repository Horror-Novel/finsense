// Runs a promise after the response has been sent without losing it.
// On Vercel a function can be frozen as soon as it responds, so un-awaited
// work (embeddings, realtime pushes) is handed to waitUntil(), which keeps
// the function alive until it settles. Elsewhere it just runs normally.
let waitUntil = null;
if (process.env.VERCEL) {
  try {
    ({ waitUntil } = require("@vercel/functions"));
  } catch {
    waitUntil = null;
  }
}

function runInBackground(promise, label = "background task") {
  const guarded = Promise.resolve(promise).catch((err) => {
    console.error(`⚠️  ${label} failed:`, err.message);
  });
  if (waitUntil) waitUntil(guarded);
  return guarded;
}

module.exports = { runInBackground };
