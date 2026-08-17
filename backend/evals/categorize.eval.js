// LLM EVAL SET — run with `npm run eval` from the backend folder.
//
// This is a small, labeled dataset of expense descriptions with a
// human-decided "correct" category, run against the REAL categorizeExpense()
// function used in production. It's the difference between "the AI seems to
// work" and having an actual, repeatable, numeric accuracy score you can
// quote — and re-run every time you touch the prompt to catch regressions.
//
// This script talks to a live Gemini API and a live Postgres connection
// (for usage logging inside categorizeExpense), so `backend/.env` must be
// configured before running it.

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const { categorizeExpense } = require("../src/services/llm.service");

// Hand-labeled test cases. Keep these realistic — copied from how a real
// user would actually type an expense, not artificially clean examples.
const testCases = [
  { description: "Swiggy order 450 rupees", expectedCategory: "Food" },
  { description: "Uber ride to the airport", expectedCategory: "Transport" },
  { description: "Netflix monthly subscription", expectedCategory: "Bills" },
  { description: "Bought a t-shirt from Myntra", expectedCategory: "Shopping" },
  { description: "Electricity bill payment", expectedCategory: "Bills" },
  { description: "Movie tickets at PVR", expectedCategory: "Entertainment" },
  { description: "Groceries from BigBasket", expectedCategory: "Food" },
  { description: "Petrol for the bike", expectedCategory: "Transport" },
  { description: "Amazon order - phone case", expectedCategory: "Shopping" },
  { description: "Gym membership renewal", expectedCategory: "Bills" },
  { description: "Chai and samosa from the tapri", expectedCategory: "Food" },
  { description: "Ola auto to college", expectedCategory: "Transport" },
];

const existingCategories = [
  { name: "Food" },
  { name: "Transport" },
  { name: "Shopping" },
  { name: "Bills" },
  { name: "Entertainment" },
  { name: "Other" },
];

function matches(actual, expected) {
  return String(actual).trim().toLowerCase() === expected.trim().toLowerCase();
}

async function run() {
  console.log(`\nRunning ${testCases.length} categorization eval cases against Gemini...\n`);

  let passed = 0;
  const rows = [];

  for (const tc of testCases) {
    try {
      const result = await categorizeExpense({
        description: tc.description,
        existingCategories,
        userId: 0, // eval run — not tied to a real user; usage logging
        // fails silently (by design) if there's no user with id 0
      });

      const ok = matches(result.category, tc.expectedCategory);
      if (ok) passed++;

      rows.push({
        description: tc.description,
        expected: tc.expectedCategory,
        got: result.category,
        confidence: result.confidence,
        pass: ok ? "✅" : "❌",
      });
    } catch (err) {
      rows.push({
        description: tc.description,
        expected: tc.expectedCategory,
        got: "ERROR",
        confidence: "-",
        pass: "❌",
      });
      console.error(`Error on "${tc.description}":`, err.message);
    }
  }

  console.table(rows);

  const accuracy = passed / testCases.length;
  console.log(`\nAccuracy: ${passed}/${testCases.length} (${(accuracy * 100).toFixed(1)}%)\n`);

  if (accuracy < 0.7) {
    console.warn("⚠️  Accuracy below 70% — consider revisiting the categorization prompt.\n");
  }
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Eval run failed:", err);
    process.exit(1);
  });
