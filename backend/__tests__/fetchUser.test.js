const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

const fetchUser = require("../middleware/fetchUser");

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

describe("fetchUser middleware", () => {
  it("rejects a request with no auth-token header", () => {
    const req = { header: () => undefined };
    const res = mockRes();
    const next = jest.fn();

    fetchUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects a request with a garbage token", () => {
    const req = { header: () => "not-a-real-jwt" };
    const res = mockRes();
    const next = jest.fn();

    fetchUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects a token signed with a different secret", () => {
    const badToken = jwt.sign({ user: { id: "123" } }, "wrong-secret");
    const req = { header: () => badToken };
    const res = mockRes();
    const next = jest.fn();

    fetchUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("attaches req.user and calls next() for a valid token", () => {
    const goodToken = jwt.sign({ user: { id: "user-123" } }, process.env.JWT_SECRET);
    const req = { header: () => goodToken };
    const res = mockRes();
    const next = jest.fn();

    fetchUser(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toEqual({ id: "user-123" });
    expect(res.status).not.toHaveBeenCalled();
  });
});
