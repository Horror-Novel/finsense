const mongoose = require("mongoose");

// Chat is stored in MongoDB (rather than Postgres) because its shape is
// naturally flexible/variable — messages can carry optional metadata like
// which tool was used or which transactions were referenced, without
// needing a schema migration every time we add a new field.
const chatMessageSchema = new mongoose.Schema(
  {
    userId: {
      type: Number, // references Postgres users.id (referencing, not embedding,
      required: true, // since Mongo doesn't own the User entity)
      index: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    // Optional metadata — e.g. which transactions the assistant used as
    // context, or tool calls it made. Demonstrates why a flexible
    // document model helps here vs. a rigid relational table.
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Lets a user pin a particularly useful answer — the "Update" half of
    // Mongo CRUD (see PATCH /api/chat/history/:id).
    starred: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

chatMessageSchema.index({ userId: 1, createdAt: 1 });

module.exports = mongoose.model("ChatMessage", chatMessageSchema);
