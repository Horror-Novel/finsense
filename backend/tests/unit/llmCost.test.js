// Unit tests for the LLM cost estimator — the only pure function exported
// from llm.service.js. We test it in isolation by requiring just that export;
// all actual Gemini API calls are never made because no test here triggers
// network I/O (the function is pure arithmetic).
const { estimateCostUsd } = require("../../src/services/llm.service");

describe("estimateCostUsd", () => {
  it("returns 0 for zero tokens", () => {
    expect(estimateCostUsd(0, 0)).toBe(0);
  });

  it("returns a positive number for non-zero tokens", () => {
    const cost = estimateCostUsd(1000, 200);
    expect(cost).toBeGreaterThan(0);
  });

  it("scales linearly with input tokens", () => {
    const single = estimateCostUsd(1000, 0);
    const double = estimateCostUsd(2000, 0);
    expect(double).toBeCloseTo(single * 2, 8);
  });

  it("scales linearly with output tokens", () => {
    const single = estimateCostUsd(0, 1000);
    const double = estimateCostUsd(0, 2000);
    expect(double).toBeCloseTo(single * 2, 8);
  });

  it("output tokens are more expensive than input tokens", () => {
    const inputCost = estimateCostUsd(1000, 0);
    const outputCost = estimateCostUsd(0, 1000);
    expect(outputCost).toBeGreaterThan(inputCost);
  });

  it("returns a number (not NaN or undefined)", () => {
    const result = estimateCostUsd(500, 100);
    expect(typeof result).toBe("number");
    expect(isNaN(result)).toBe(false);
  });
});
