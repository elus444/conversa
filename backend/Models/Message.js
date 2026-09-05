const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: function () {
        return !this.imageUrl;
      },
    },
    imageUrl: {
      type: String,
      required: function () {
        return !this.text;
      },
    },
    seenBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        seenAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // hiddenFrom: hard-deleted for these users — skipped entirely in queries
    hiddenFrom: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    // softDeleted: message shows as "This message was deleted" tombstone for everyone
    softDeleted: { type: Boolean, default: false },
    // starredBy: users who have starred this message
    starredBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: "Message",
    },
    // editedAt: set the first time a message's text is edited; null if never edited.
    // Original text is not retained — this app doesn't keep an edit history.
    editedAt: { type: Date, default: null },
    // reactions: one emoji per user per message (re-reacting replaces the previous one)
    reactions: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        emoji: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Every message list/pagination/search query filters by conversationId and
// sorts by createdAt — this compound index covers that access pattern directly.
MessageSchema.index({ conversationId: 1, createdAt: -1 });

// Text index for full-text search (Controllers/message-controller.js#searchMessages).
// Sparse-friendly: documents with no `text` (image-only messages) are just excluded.
MessageSchema.index({ text: "text" });

const Message = mongoose.model("Message", MessageSchema);
module.exports = Message;
