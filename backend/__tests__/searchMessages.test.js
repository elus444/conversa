process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

const jwt = require("jsonwebtoken");
const request = require("supertest");
const app = require("../app");

const token = jwt.sign({ user: { id: "507f1f77bcf86cd799439011" } }, process.env.JWT_SECRET);

describe("GET /message/search", () => {
  it("requires a query string", async () => {
    const res = await request(app)
      .get("/message/search")
      .set("auth-token", token);
    expect(res.status).toBe(400);
  });

  it("requires authentication", async () => {
    const res = await request(app).get("/message/search?q=hello");
    expect(res.status).toBe(401);
  });
});
