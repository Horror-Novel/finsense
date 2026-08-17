// Basic integration test demonstrating "automated API testing" — run with
// `npm test` after setting up a test database. Uses supertest to hit the
// real Express app without starting a live server on a port.
const request = require("supertest");
const app = require("../src/app");

describe("Auth API", () => {
  it("GET /api/health returns 200", async () => {
    const res = await request(app).get("/api/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("POST /api/auth/signup rejects invalid email with 400", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ name: "Test", email: "not-an-email", password: "123456" });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("POST /api/auth/login rejects wrong credentials with 401", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@nowhere.com", password: "wrongpass" });

    expect(res.statusCode).toBe(401);
  });

  it("GET /api/auth/me without a token returns 401", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.statusCode).toBe(401);
  });
});
