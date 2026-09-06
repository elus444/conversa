// These cover the validation branches of forgotPassword/resetPassword,
// which run before any DB call — no live database needed to exercise them.

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

const { forgotPassword, resetPassword } = require("../Controllers/auth-controller");

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

describe("forgotPassword validation", () => {
  it("rejects a request with no email", async () => {
    const req = { body: {} };
    const res = mockRes();

    await forgotPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe("resetPassword validation", () => {
  it("rejects a request missing email/otp/newPassword", async () => {
    const req = { body: { email: "user@example.com" } };
    const res = mockRes();

    await resetPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining("required") })
    );
  });

  it("rejects a new password under 6 characters", async () => {
    const req = { body: { email: "user@example.com", otp: "123456", newPassword: "abc" } };
    const res = mockRes();

    await resetPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining("6 characters") })
    );
  });
});
