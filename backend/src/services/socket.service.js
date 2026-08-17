const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

let io = null;

// Sets up WebSocket support for real-time, cross-tab/cross-device sync.
// Use case: if you have FinSense open in two browser tabs and add an
// expense in one, the other tab updates instantly — no manual refresh,
// no polling. This runs alongside (not instead of) the existing SSE
// chat streaming, which is a one-way server->client text stream; this
// WebSocket layer is for structured, bidirectional, low-latency events.
function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
      credentials: true,
    },
  });

  // Auth handshake — the client sends its JWT once on connect, we verify
  // it exactly like the HTTP requireAuth middleware does, and reject the
  // socket entirely if it's missing or invalid.
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("No token provided"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    // Every user gets their own private "room" — events for user 42 only
    // ever reach sockets that authenticated as user 42, never anyone else.
    socket.join(`user:${socket.userId}`);

    socket.on("disconnect", () => {
      // socket.io handles room cleanup automatically on disconnect
    });
  });

  console.log("🔌 WebSocket server ready");
  return io;
}

// Broadcasts an event to every open tab/device for one specific user.
// Called from controllers/tools after a transaction is created/deleted.
function emitToUser(userId, event, payload) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
}

module.exports = { initSocket, emitToUser };
