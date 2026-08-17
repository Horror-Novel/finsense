// Unit tests for the validate and errorHandler middleware.
// No DB or network calls — pure in-memory Express middleware testing.
const validate = require("../../src/middleware/validate");
const { notFound, errorHandler } = require("../../src/middleware/errorHandler");
const ApiError = require("../../src/utils/apiError");
const { z } = require("zod");

function mockReq(body = {}) { return { body, method: "GET", originalUrl: "/test" }; }
function mockRes() {
  const r = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  return r;
}
function mockNext() { return jest.fn(); }

// ── validate() middleware ──────────────────────────────────────────────────
describe("validate middleware", () => {
  const schema = z.object({ name: z.string().min(2) });

  it("calls next() when body is valid", () => {
    const next = mockNext();
    validate(schema)(mockReq({ name: "Karti" }), mockRes(), next);
    expect(next).toHaveBeenCalledWith(); // no arguments = success
  });

  it("calls next(ApiError) when body is invalid", () => {
    const next = mockNext();
    validate(schema)(mockReq({ name: "A" }), mockRes(), next);
    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(400);
  });

  it("attaches parsed data to req.body on success", () => {
    const req = mockReq({ name: "  Karti  " }); // leading/trailing spaces
    validate(schema)(req, mockRes(), mockNext());
    // Zod trims if .trim() is in schema — here it isn't, just a min check
    expect(req.body.name).toBeDefined();
  });
});

// ── notFound() middleware ─────────────────────────────────────────────────
describe("notFound middleware", () => {
  it("calls next with a 404 ApiError", () => {
    const next = mockNext();
    notFound(mockReq(), mockRes(), next);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(404);
  });
});

// ── errorHandler() middleware ─────────────────────────────────────────────
describe("errorHandler middleware", () => {
  beforeAll(() => { process.env.NODE_ENV = "test"; });

  it("responds with the error's statusCode and message", () => {
    const res = mockRes();
    const err = new ApiError(422, "Unprocessable");
    errorHandler(err, mockReq(), res, mockNext());
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "Unprocessable" })
    );
  });

  it("defaults to 500 for errors without a statusCode", () => {
    const res = mockRes();
    errorHandler(new Error("boom"), mockReq(), res, mockNext());
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("maps P2002 Prisma code to 409 Conflict", () => {
    const res = mockRes();
    const prismaErr = Object.assign(new Error("unique"), {
      code: "P2002",
      meta: { target: ["email"] },
    });
    errorHandler(prismaErr, mockReq(), res, mockNext());
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it("maps JsonWebTokenError to 401", () => {
    const res = mockRes();
    const jwtErr = Object.assign(new Error("invalid"), { name: "JsonWebTokenError" });
    errorHandler(jwtErr, mockReq(), res, mockNext());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("maps TokenExpiredError to 401", () => {
    const res = mockRes();
    const expErr = Object.assign(new Error("expired"), { name: "TokenExpiredError" });
    errorHandler(expErr, mockReq(), res, mockNext());
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
