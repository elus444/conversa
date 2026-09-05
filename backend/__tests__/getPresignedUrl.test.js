// These cover the validation branch of getPresignedUrl, which runs before
// any R2/network call is made — so no live credentials or DB are needed to
// exercise them.

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

const { getPresignedUrl } = require("../Controllers/user-controller");

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("getPresignedUrl validation", () => {
  it("rejects a request missing filename/filetype", async () => {
    const req = { query: {}, user: { id: "user-1" } };
    const res = mockRes();

    await getPresignedUrl(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining("required") })
    );
  });

  it("rejects a non-image filetype", async () => {
    const req = {
      query: { filename: "resume.pdf", filetype: "application/pdf", filesize: "1000" },
      user: { id: "user-1" },
    };
    const res = mockRes();

    await getPresignedUrl(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining("Invalid file type") })
    );
  });

  it("rejects a file over the 5MB limit", async () => {
    const req = {
      query: {
        filename: "huge.png",
        filetype: "image/png",
        filesize: String(6 * 1024 * 1024),
      },
      user: { id: "user-1" },
    };
    const res = mockRes();

    await getPresignedUrl(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining("5MB") })
    );
  });

  it("rejects a missing/invalid filesize", async () => {
    const req = {
      query: { filename: "photo.png", filetype: "image/png", filesize: "not-a-number" },
      user: { id: "user-1" },
    };
    const res = mockRes();

    await getPresignedUrl(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});
