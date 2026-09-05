const express = require("express");
const router = express.Router();

const {
  register,
  login,
  authUser,
  sendotp,
  sendVerificationOtp,
  verifyEmail,
  refreshAccessToken,
  logout,
} = require("../Controllers/auth-controller.js");
const fetchuser = require("../middleware/fetchUser.js");

router.post("/register", register);
router.post("/login", login);
router.post("/getotp", sendotp);
router.post("/refresh", refreshAccessToken);
router.get("/me", fetchuser, authUser);
router.post("/send-verification-otp", fetchuser, sendVerificationOtp);
router.post("/verify-email", fetchuser, verifyEmail);
router.post("/logout", fetchuser, logout);

module.exports = router;
