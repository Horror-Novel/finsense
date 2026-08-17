const mongoose = require("mongoose");

// Stores the output of the scheduled digest cron job (see cron.service.js).
// Lives in MongoDB rather than Postgres for the same reason chat messages
// do: category breakdowns per digest can vary in shape (different users
// have different categories), which suits a flexible document over a
// rigid relational table with a fixed set of columns.
const digestSchema = new mongoose.Schema(
  {
    userId: {
      type: Number, // references Postgres users.id (referencing, not embedding)
      required: true,
      index: true,
    },
    periodLabel: {
      type: String, // e.g. "2026-08-14" — the day this digest summarizes
      required: true,
    },
    totalSpent: {
      type: Number,
      required: true,
    },
    topCategory: {
      type: String,
      default: null,
    },
    categoryBreakdown: {
      type: mongoose.Schema.Types.Mixed, // { "Food": 450, "Transport": 180, ... }
      default: {},
    },
    transactionCount: {
      type: Number,
      default: 0,
    },
    generatedBy: {
      type: String,
      enum: ["cron", "manual"],
      default: "cron",
    },
  },
  { timestamps: true }
);

digestSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Digest", digestSchema);
