// Express app configuration, kept separate from index.js's server-startup
// logic (DB connect, socket.io, http.listen) so it can be imported directly
// in tests with supertest — no live server or DB connection required just
// to exercise routing/middleware.

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.json({ limit: "50mb" }));

// Auth endpoints (login/register/OTP) are the main brute-force target —
// cap them more tightly than the general API.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts, please try again later." },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.use("/auth", authLimiter, require("./Routes/auth-routes.js"));
app.use("/user", apiLimiter, require("./Routes/user-routes.js"));
app.use("/message", apiLimiter, require("./Routes/message-routes.js"));
app.use("/conversation", apiLimiter, require("./Routes/conversation-routes.js"));

module.exports = app;
