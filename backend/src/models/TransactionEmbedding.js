const mongoose = require("mongoose");

// RAG (Retrieval-Augmented Generation) storage.
// When a transaction is created, we call Gemini's text-embedding model
// to convert its description + category into a dense vector, then store
// it here alongside the original Postgres transaction ID.
//
// At query time, we embed the user's question and find the N most
// semantically similar transaction embeddings using cosine similarity —
// those transactions become the grounding context for the LLM answer,
// instead of a flat "most recent 50" snapshot.
//
// WHY MONGO OVER PGVECTOR? For a college project, keeping embeddings in
// the existing Mongo instance is simpler than adding the pgvector Postgres
// extension. In production you'd use pgvector or Pinecone.
const embeddingSchema = new mongoose.Schema(
  {
    userId: { type: Number, required: true, index: true },
    transactionId: { type: Number, required: true, index: true },
    text: { type: String, required: true }, // the text that was embedded
    vector: { type: [Number], required: true }, // Gemini embedding-004 = 768 dims
    category: { type: String, default: "Uncategorized" },
    amount: { type: Number },
    spentAt: { type: Date },
  },
  { timestamps: true }
);

embeddingSchema.index({ userId: 1, transactionId: 1 }, { unique: true });

module.exports = mongoose.model("TransactionEmbedding", embeddingSchema);
