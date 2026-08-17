/**
 * closureDemo.js — Backend closure utilities (mirrors frontend lib/useClosures.js)
 *
 * These are the same closure factories as the frontend, exported for the
 * debug route so the concept is demonstrated on BOTH sides of the stack.
 */

// Debouncer — closes over `timer`
function createDebouncer(delayMs = 300) {
  let timer = null; // closed-over variable
  return function debounced(fn) {
    clearTimeout(timer);
    timer = setTimeout(fn, delayMs);
  };
}

// Rate limiter — closes over `calls`
function createRateLimiter(maxCalls = 5, windowMs = 60000) {
  let calls = []; // closed-over variable — private to each instance
  return function isAllowed() {
    const now = Date.now();
    calls = calls.filter((t) => now - t < windowMs);
    if (calls.length >= maxCalls) return false;
    calls.push(now);
    return true;
  };
}

module.exports = { createDebouncer, createRateLimiter };
