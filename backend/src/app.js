const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

const authRoutes = require("./routes/auth.routes");
const categoryRoutes = require("./routes/categories.routes");
const transactionRoutes = require("./routes/transactions.routes");
const chatRoutes = require("./routes/chat.routes");
const agentRoutes = require("./routes/agent.routes");
const digestRoutes = require("./routes/digests.routes");
const paymentRoutes = require("./routes/payment.routes");
const debugRoutes = require("./routes/debug.routes");
const adminRoutes = require("./routes/admin.routes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

// --- Global middleware ---
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" })); // body parsing + implicit size-based sanitization
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev")); // request logging

// Serve uploaded receipt images
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// --- Health check ---
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "FinSense API is running" });
});

// --- Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/agent", agentRoutes);
app.use("/api/digests", digestRoutes);
app.use("/api/payments", paymentRoutes);
// Debug routes — no auth required, intentionally open for viva demonstration.
// Open http://localhost:5000/api/debug/hoisting or /api/debug/closures in
// a browser during the viva to show live runtime proof of both concepts.
app.use("/api/debug", debugRoutes);
app.use("/api/admin", adminRoutes);

// --- 404 + centralized error handler (always last) ---
app.use(notFound);
app.use(errorHandler);

module.exports = app;
