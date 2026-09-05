process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

const request = require("supertest");
const app = require("../app");

describe("app", () => {
  it("responds on the health-check route", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.text).toBe("Hello World");
  });

  it("sets security headers via helmet", async () => {
    const res = await request(app).get("/");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });

  it("rejects protected routes with no auth token", async () => {
    const res = await request(app).get("/auth/me");
    expect(res.status).toBe(401);
  });

  it("rejects register with missing fields", async () => {
    const res = await request(app).post("/auth/register").send({});
    expect(res.status).toBe(400);
  });
});
