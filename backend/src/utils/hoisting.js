/**
 * hoisting.js — DELIBERATE HOISTING DEMONSTRATIONS
 *
 * Hoisting is JavaScript's behaviour of moving DECLARATIONS to the top
 * of their scope before any code executes. Only the declaration is hoisted —
 * not the initialisation/assignment.
 *
 * There are TWO kinds of hoisting worth knowing for a viva:
 *
 * 1. FUNCTION DECLARATION hoisting — the entire function body is hoisted,
 *    so you can call the function BEFORE the line where it is written.
 *
 * 2. VAR hoisting — the variable name is hoisted (declared as `undefined`)
 *    but its value is NOT, so reading it before the assignment gives
 *    `undefined`, not a ReferenceError.
 *
 * `let` and `const` ARE hoisted too, but they sit in a "temporal dead zone"
 * until the declaration line — accessing them before that throws ReferenceError.
 * That's why you should always use `const`/`let` in modern code.
 *
 * VIVA EXPLANATION:
 *   "In formatCurrency below, I call the helper `toPaise` before its function
 *    declaration appears in the source. This works because JavaScript hoists
 *    function declarations to the top of the scope before execution begins.
 *    I intentionally structured the code this way to make hoisting visible
 *    rather than accidental."
 */

// ─────────────────────────────────────────────────────────────────────────────
// HOISTING EXAMPLE 1 — Function declaration hoisting
//
// `toPaise` is CALLED here, on the line below, BEFORE it is DECLARED.
// This works only because function declarations are hoisted in their entirety.
// If `toPaise` were a `const` arrow function instead, this would throw:
//   ReferenceError: Cannot access 'toPaise' before initialization
// ─────────────────────────────────────────────────────────────────────────────

// ← toPaise is called here (line 44 in source) ...
function formatCurrency(amountInRupees) {
  const paise = toPaise(amountInRupees); // ← CALLED BEFORE DECLARATION ✓
  return `₹${amountInRupees.toFixed(2)} (${paise} paise)`;
}

// ... but declared here (line 51 in source). JS hoists it upward before running.
function toPaise(rupees) {
  return Math.round(rupees * 100);
}

// ─────────────────────────────────────────────────────────────────────────────
// HOISTING EXAMPLE 2 — var hoisting (declaration hoisted, value is NOT)
//
// This function intentionally uses `var` to make the behaviour visible.
// In real app code we use `const`/`let` everywhere — this is here solely
// to demonstrate what hoisting does and why `var` can be surprising.
// ─────────────────────────────────────────────────────────────────────────────
function demonstrateVarHoisting() {
  // At runtime, JS re-arranges this as if it were written:
  //   var result;           ← declaration hoisted to top of function
  //   console.log(result);  ← undefined (not ReferenceError), because declaration exists
  //   result = "hoisted!";  ← assignment stays here, NOT hoisted

  // eslint-disable-next-line no-use-before-define
  const before = result; // `result` is declared (hoisted) but undefined here

  var result = "hoisted!"; // eslint-disable-line vars-on-top

  const after = result; // "hoisted!" — now the assignment has run

  return { before, after };
  // Returns: { before: undefined, after: "hoisted!" }
  // `before` is undefined (not ReferenceError) — that's var hoisting.
}

// ─────────────────────────────────────────────────────────────────────────────
// HOISTING EXAMPLE 3 — Why const/let are safer (temporal dead zone)
//
// Uncommenting the line below would throw:
//   ReferenceError: Cannot access 'safeValue' before initialization
// because `const` is in the "temporal dead zone" until its declaration line.
// ─────────────────────────────────────────────────────────────────────────────
function demonstrateTemporalDeadZone() {
  // const earlyRead = safeValue; // ← would throw ReferenceError if uncommented
  const safeValue = "I'm a const — temporal dead zone until this line";
  return safeValue;
}

// ─────────────────────────────────────────────────────────────────────────────
// Real app usage — these helpers are exported and used by the debug route
// GET /api/debug/hoisting, which returns a live JSON response you can show
// in a viva browser demo to prove hoisting is actually exercised at runtime.
// ─────────────────────────────────────────────────────────────────────────────
function getHoistingDemo() {
  return {
    concept: "JavaScript Hoisting",
    examples: {
      functionHoisting: {
        explanation:
          "formatCurrency() calls toPaise() before toPaise is declared in source. " +
          "Works because function declarations are hoisted entirely.",
        result: formatCurrency(450),
      },
      varHoisting: {
        explanation:
          "var declaration is hoisted (undefined), assignment is not. " +
          "Reading `result` before its assignment gives undefined, not a ReferenceError.",
        result: demonstrateVarHoisting(),
      },
      temporalDeadZone: {
        explanation:
          "const/let are hoisted but sit in a temporal dead zone until their declaration line. " +
          "Accessing them early throws ReferenceError — this is why const/let are safer than var.",
        result: demonstrateTemporalDeadZone(),
      },
    },
    vivaNote:
      "Function declarations are fully hoisted. var declarations are hoisted as undefined. " +
      "const/let are hoisted but in a temporal dead zone. In this codebase, asyncHandler " +
      "and every Express middleware function can be called before their declaration in " +
      "require() order because Node caches modules — a real-world hoisting-adjacent effect.",
  };
}

module.exports = { formatCurrency, toPaise, demonstrateVarHoisting, getHoistingDemo };
