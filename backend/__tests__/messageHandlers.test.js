// Covers the validation branches of the real-time message-edit and
// reaction handlers that return before ever touching the database, so no
// live DB connection is needed here.

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

const { editMessageHandler, toggleReactionHandler } = require("../Controllers/message-controller");

describe("editMessageHandler validation", () => {
  it("rejects empty/whitespace-only text without touching the DB", async () => {
    const result = await editMessageHandler({
      messageId: "irrelevant",
      requesterId: "irrelevant",
      newText: "   ",
    });
    expect(result).toBe(false);
  });

  it("rejects a missing newText", async () => {
    const result = await editMessageHandler({
      messageId: "irrelevant",
      requesterId: "irrelevant",
      newText: undefined,
    });
    expect(result).toBe(false);
  });
});

describe("toggleReactionHandler validation", () => {
  it("rejects a missing emoji without touching the DB", async () => {
    const result = await toggleReactionHandler({
      messageId: "irrelevant",
      userId: "irrelevant",
      emoji: undefined,
    });
    expect(result).toBe(false);
  });
});
