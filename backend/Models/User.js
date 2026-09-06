const mongoose = require("mongoose");

const Userschema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
    },
    about: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    profilePic: {
      type: String,
      default:
        "https://ui-avatars.com/api/?name=Conversa&background=random&bold=true",
    },
    otp: {
      type: String,
      default: "",
    },
    otpExpiry: {
      type: Date,
      default: null,
    },
    // Separate from `otp` above (shared by login-OTP and email verification)
    // so a pending password reset can't collide with either of those flows.
    resetPasswordOtp: {
      type: String,
      default: "",
    },
    resetPasswordOtpExpiry: {
      type: Date,
      default: null,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailNotificationsEnabled: {
      type: Boolean,
      default: true,
    },
    isBot: {
      type: Boolean,
      default: false,
    },
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    pinnedConversations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation",
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
    // Refresh-token strategy: the access token (JWT) is short-lived (see
    // JWT_ACCESS_EXPIRY); this stores a hash of the current refresh token
    // (never the raw token) plus its expiry, so /auth/refresh can verify
    // and rotate it. One active refresh token per user — logging in again
    // (or on a second device) invalidates the previous one.
    refreshTokenHash: {
      type: String,
      default: null,
    },
    refreshTokenExpiry: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// getNonFriendsList (user-controller.js) searches/sorts on name and lastSeen.
Userschema.index({ name: 1 });
Userschema.index({ lastSeen: -1 });

const User = mongoose.model("User", Userschema);
module.exports = User;
