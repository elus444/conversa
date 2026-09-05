const http = require("http");
const PORT = process.env.PORT || 5500;
const app = require("./app.js");
const connectDB = require("./db.js");
const { initSocket } = require("./socket/index.js");
const { startStaleOnlineUsersJob } = require("./jobs/staleOnlineUsers.js");

// Server setup
const server = http.createServer(app);

// Socket.io setup
initSocket(server); // Initialize socket.io logic

// Start server and connect to database
const start = async () => {
  await connectDB(); // connect first
  server.listen(PORT, () => {
    console.log(`🚀 Server started at http://localhost:${PORT}`);
  });
  // Start background jobs after DB is ready
  startStaleOnlineUsersJob();
};

start();
