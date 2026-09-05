process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

const request = require("supertest");
const app = require("../app");

describe("POST /auth/refresh", () => {
  it("rejects a request with no refreshToken", async () => {
    const res = await request(app).post("/auth/refresh").send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/refreshToken/i);
  });
});
