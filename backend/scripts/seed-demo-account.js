/**
 * seed-demo-account.js
 * Creates (or refreshes) a permanent, pre-verified guest account plus a
 * couple of populated conversations, so a recruiter clicking "Try as Guest"
 * on the landing page lands in a lively inbox instead of an empty one.
 *
 * Safe to re-run — it upserts by email rather than duplicating.
 *
 * Usage:
 *   node scripts/seed-demo-account.js
 */

const bcrypt = require("bcryptjs");
const connectDB = require("../db");
const User = require("../Models/User");
const Conversation = require("../Models/Conversation");
const Message = require("../Models/Message");

const GUEST_EMAIL = "guest@conversa.demo";
const GUEST_PASSWORD = "GuestDemo123!";

const CONTACTS = [
  {
    name: "Alex Rivera",
    about: "Product designer 🎨 | coffee-powered",
    messages: [
      { from: "contact", text: "Hey! Did you see the new mockups I sent over?" },
      { from: "guest", text: "Just opened them — the dashboard redesign looks great!" },
      { from: "contact", text: "Glad you like it 🙌 Let's sync tomorrow to finalize." },
      { from: "guest", text: "Works for me, I'll block off 2pm." },
    ],
  },
  {
    name: "Sam Chen",
    about: "Backend engineer ⚙️ | building this app's API",
    messages: [
      { from: "contact", text: "Deployed the latest changes to staging, want to check it out?" },
      { from: "guest", text: "On it — looks solid so far 👍" },
      { from: "contact", text: "Nice. Ping me if anything looks off." },
    ],
  },
];

const run = async () => {
  await connectDB();

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(GUEST_PASSWORD, salt);

  let guest = await User.findOne({ email: GUEST_EMAIL });
  if (!guest) {
    guest = await User.create({
      name: "Guest",
      email: GUEST_EMAIL,
      password: hashedPassword,
      about: "Just looking around 👋",
      profilePic: `https://ui-avatars.com/api/?name=Guest&background=random&bold=true`,
      isEmailVerified: true,
    });
    console.log(`✅ Created guest account <${GUEST_EMAIL}>`);
  } else {
    console.log(`⏭  Guest account already exists <${GUEST_EMAIL}>`);
  }

  // The guest needs its own AI-bot conversation, same as a real signup gets.
  const botEmail = GUEST_EMAIL + "bot";
  let bot = await User.findOne({ email: botEmail });
  if (!bot) {
    bot = await User.create({
      name: "AI Chatbot",
      email: botEmail,
      password: hashedPassword,
      about: "I am an AI Chatbot to help you",
      profilePic:
        "https://play-lh.googleusercontent.com/Oe0NgYQ63TGGEr7ViA2fGA-yAB7w2zhMofDBR3opTGVvsCFibD8pecWUjHBF_VnVKNdJ",
      isBot: true,
      isEmailVerified: true,
    });
    await Conversation.create({
      members: [guest._id, bot._id],
      unreadCounts: [
        { userId: guest._id, count: 0 },
        { userId: bot._id, count: 0 },
      ],
    });
    console.log("✅ Created guest's AI chatbot conversation");
  }

  for (const contact of CONTACTS) {
    const contactEmail = `${contact.name.toLowerCase().replace(/[^a-z0-9]/g, "")}@conversa-demo.dev`;
    let contactUser = await User.findOne({ email: contactEmail });

    if (!contactUser) {
      contactUser = await User.create({
        name: contact.name,
        email: contactEmail,
        password: hashedPassword,
        about: contact.about,
        profilePic: `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&background=random&bold=true`,
        isEmailVerified: true,
      });
      console.log(`✅ Created demo contact ${contact.name}`);
    }

    let conversation = await Conversation.findOne({
      members: { $all: [guest._id, contactUser._id], $size: 2 },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        members: [guest._id, contactUser._id],
        latestmessage: contact.messages[contact.messages.length - 1].text,
        unreadCounts: [
          { userId: guest._id, count: 0 },
          { userId: contactUser._id, count: 0 },
        ],
      });

      let ts = Date.now() - contact.messages.length * 5 * 60 * 1000;
      for (const m of contact.messages) {
        await Message.create({
          conversationId: conversation._id,
          senderId: m.from === "guest" ? guest._id : contactUser._id,
          text: m.text,
          createdAt: new Date(ts),
          updatedAt: new Date(ts),
        });
        ts += 5 * 60 * 1000;
      }
      console.log(`✅ Seeded conversation + messages with ${contact.name}`);
    } else {
      console.log(`⏭  Conversation with ${contact.name} already exists`);
    }
  }

  console.log(`\nDone. Guest login: ${GUEST_EMAIL} / ${GUEST_PASSWORD}`);
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
