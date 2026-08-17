const ApiError = require("../../src/utils/apiError");

describe("ApiError", () => {
  it("creates an error with statusCode and message", () => {
    const err = new ApiError(404, "Not found");
    expect(err).toBeInstanceOf(Error);
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe("Not found");
    expect(err.details).toBeNull();
  });

  it("accepts optional details", () => {
    const details = [{ field: "email", message: "Invalid" }];
    const err = new ApiError(400, "Validation failed", details);
    expect(err.details).toEqual(details);
  });

  it("is an instance of Error (works with try/catch)", () => {
    expect(() => { throw new ApiError(500, "boom"); }).toThrow("boom");
  });

  it("captures a stack trace", () => {
    const err = new ApiError(400, "test");
    expect(typeof err.stack).toBe("string");
    expect(err.stack.length).toBeGreaterThan(0);
  });
});
