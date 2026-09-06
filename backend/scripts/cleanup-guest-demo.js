/**
 * One-off cleanup for the guest demo conversation: removes stray messages
 * left over from manual testing (an extra image, an edited test message)
 * and recomputes the conversation's latestmessage so the sidebar preview
 * matches what's actually there.
 *
 * Safe to delete after running once — not part of the app's normal operation.
 */
const connectDB = require("../db");
const Conversation = require("../Models/Conversation");
const Message = require("../Models/Message");

const CONVERSATION_ID = "6a9b9b6b6f3650769c3a9ecf"; // guest <-> Sam Chen
const KEEP_TEXTS = [
  "Deployed the latest changes to staging, want to check it out?",
  "On it — looks solid so far 👍",
  "Nice. Ping me if anything looks off.",
];

const run = async () => {
  await connectDB();

  const all = await Message.find({ conversationId: CONVERSATION_ID }).sort({ createdAt: 1 });
  console.log(`Found ${all.length} messages`);

  const toDelete = all.filter((m) => !KEEP_TEXTS.includes(m.text));
  for (const m of toDelete) {
    console.log(`Deleting stray message ${m._id} (text: ${m.text ?? "[image]"})`);
    await Message.findByIdAndDelete(m._id);
  }

  const remaining = await Message.find({ conversationId: CONVERSATION_ID }).sort({ createdAt: -1 }).limit(1);
  const newLatest = remaining[0]?.text || "";
  await Conversation.findByIdAndUpdate(CONVERSATION_ID, { latestmessage: newLatest });
  console.log(`Reset latestmessage to: "${newLatest}"`);

  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
