/**
 * useClosures.js — DELIBERATE CLOSURE DEMONSTRATIONS
 *
 * A closure is a function that REMEMBERS the variables from the scope
 * it was created in, even after that outer scope has finished executing.
 *
 * This file contains two real, used-in-the-app utilities that are
 * explicitly built on closures — not accidental, not toy examples.
 * Both are importable and actually called in TransactionForm.jsx
 * and Chat.jsx so you can point to real usage in a viva.
 *
 * VIVA EXPLANATION:
 *   "createDebouncer returns an inner function. That inner function
 *    closes over `timer` — a variable declared in the outer function's
 *    scope. Every time the inner function is called it can read and
 *    overwrite `timer`, even though createDebouncer has already returned.
 *    The inner function 'remembers' `timer` because it was defined in
 *    the same scope — that's exactly what a closure is."
 */

// ─────────────────────────────────────────────────────────────────────────────
// CLOSURE 1: Debouncer factory
//
// createDebouncer() is called ONCE. It declares `timer` in its local scope
// and returns an inner function. The inner function CLOSES OVER `timer` —
// it reads and writes `timer` on every call, long after createDebouncer()
// itself has returned. Without a closure, `timer` would not be accessible
// to the returned function at all.
//
// Usage: const debouncedSearch = createDebouncer(300);
//        debouncedSearch(() => fetchResults(query));  // called on every keystroke
// ─────────────────────────────────────────────────────────────────────────────
export function createDebouncer(delayMs = 300) {
  // `timer` lives in createDebouncer's scope.
  // The returned function closes over it.
  let timer = null;

  // This is the closure — an inner function returned from an outer function,
  // carrying a live reference to `timer` in its own private memory.
  return function debounced(fn) {
    // `timer` is accessible here even though createDebouncer() has returned —
    // the closure keeps it alive.
    clearTimeout(timer);
    timer = setTimeout(fn, delayMs);
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CLOSURE 2: Client-side rate limiter factory
//
// createRateLimiter() returns a function that "remembers" how many times
// it has been called within a sliding window, via the closed-over `calls`
// array. Each returned function has its OWN private `calls` array —
// two rate limiters created with the same arguments don't share state.
// That isolation is only possible because of closures.
//
// Usage: const limitChat = createRateLimiter(5, 60000); // 5 calls per minute
//        if (!limitChat()) { alert("Slow down!"); return; }
// ─────────────────────────────────────────────────────────────────────────────
export function createRateLimiter(maxCalls = 5, windowMs = 60000) {
  // `calls` is closed over — private to each limiter instance.
  let calls = [];

  return function isAllowed() {
    const now = Date.now();
    // Evict timestamps outside the current window
    calls = calls.filter((t) => now - t < windowMs);

    if (calls.length >= maxCalls) {
      return false; // rate limit hit
    }

    calls.push(now);
    return true;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// React hook that wires both utilities into a component-friendly API.
// `useRef` keeps the closure instances stable across re-renders (creating
// a new debouncer on every render would reset `timer` each time, defeating
// the purpose — another real-world closure concern worth mentioning in a viva).
// ─────────────────────────────────────────────────────────────────────────────
import { useRef } from "react";

export function useDebouncer(delayMs = 300) {
  // useRef keeps the SAME closure instance alive across renders.
  // If we called createDebouncer() directly in the component body,
  // a new closure (with a fresh `timer = null`) would be created on
  // every render, making the debounce useless.
  const debouncerRef = useRef(null);
  if (!debouncerRef.current) {
    debouncerRef.current = createDebouncer(delayMs);
  }
  return debouncerRef.current;
}

export function useRateLimiter(maxCalls = 5, windowMs = 60000) {
  const limiterRef = useRef(null);
  if (!limiterRef.current) {
    limiterRef.current = createRateLimiter(maxCalls, windowMs);
  }
  return limiterRef.current;
}
