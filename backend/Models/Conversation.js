const mongoose = require("mongoose");

const ConversationSchema = new mongoose.Schema(
  {
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    latestmessage: {
      type: String,
      default: "",
    },
    unreadCounts: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        count: {
          type: Number,
          default: 0,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// conversation-controller.js finds/lists conversations by member and sorts
// by recency — this compound index covers both in one pass.
ConversationSchema.index({ members: 1, updatedAt: -1 });

const Conversation = mongoose.model("Conversation", ConversationSchema);
module.exports = Conversation;
