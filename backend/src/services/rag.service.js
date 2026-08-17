const { ai } = require("../config/gemini");
const TransactionEmbedding = require("../models/TransactionEmbedding");

// ---------------------------------------------------------------------
// Gemini embedding model
//
// text-embedding-004 is no longer available for new Gemini API usage.
// gemini-embedding-2 is the current embedding model.
//
// IMPORTANT:
// Keep this separate from the generation model used by llm.service.js.
// ---------------------------------------------------------------------

const EMBEDDING_MODEL =
  process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-2";

// ---------------------------------------------------------------------
// EMBED TEXT
//
// Converts text into a vector using Gemini's embedding API.
//
// Returns null on failure so RAG never crashes transaction creation
// or normal chat functionality.
// ---------------------------------------------------------------------

async function embed(text) {
  try {
    if (!text || !String(text).trim()) {
      return null;
    }

    const result = await ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: String(text),
    });

    // Gemini embedding responses can expose the vector through
    // embeddings[0].values.
    const vector =
      result?.embeddings?.[0]?.values ||
      result?.embedding?.values ||
      null;

    if (!Array.isArray(vector) || vector.length === 0) {
      console.error(
        "Embedding failed: Gemini returned no vector"
      );
      return null;
    }

    return vector;
  } catch (err) {
    console.error(
      `Embedding failed using ${EMBEDDING_MODEL} (non-fatal):`,
      err.message
    );

    return null;
  }
}

// ---------------------------------------------------------------------
// COSINE SIMILARITY
//
// Measures the semantic similarity between two embedding vectors.
//
// Returns:
//   1  = very similar direction
//   0  = unrelated
//  -1  = opposite direction
// ---------------------------------------------------------------------

function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) {
    return 0;
  }

  if (a.length === 0 || b.length === 0) {
    return 0;
  }

  if (a.length !== b.length) {
    return 0;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    const valueA = Number(a[i]) || 0;
    const valueB = Number(b[i]) || 0;

    dot += valueA * valueB;
    normA += valueA * valueA;
    normB += valueB * valueB;
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ---------------------------------------------------------------------
// INDEX TRANSACTION
//
// Called whenever a transaction is created.
//
// Creates a semantic representation of:
//
//   description
//   category
//   amount
//
// and stores it in MongoDB.
//
// This function is intentionally non-fatal.
// If Gemini embeddings are unavailable, the transaction itself
// still succeeds.
// ---------------------------------------------------------------------

async function indexTransaction(transaction) {
  try {
    if (!transaction) {
      return;
    }

    if (!transaction.userId || !transaction.id) {
      console.error(
        "indexTransaction skipped: missing userId or transaction id"
      );
      return;
    }

    const text = [
      transaction.description,
      transaction.category?.name ||
        transaction.categoryName ||
        "",
      transaction.amount != null
        ? `${transaction.amount} rupees`
        : "",
    ]
      .filter(Boolean)
      .join(", ");

    if (!text.trim()) {
      return;
    }

    const vector = await embed(text);

    // If embedding generation failed, don't block the transaction.
    if (!vector) {
      return;
    }

    await TransactionEmbedding.findOneAndUpdate(
      {
        userId: transaction.userId,
        transactionId: transaction.id,
      },
      {
        userId: transaction.userId,
        transactionId: transaction.id,
        text,
        vector,
        category:
          transaction.category?.name ||
          transaction.categoryName ||
          "Uncategorized",
        amount: Number(transaction.amount) || 0,
        spentAt: transaction.spentAt,
      },
      {
        upsert: true,
        new: true,
      }
    );
  } catch (err) {
    console.error(
      "indexTransaction failed (non-fatal):",
      err.message
    );
  }
}

// ---------------------------------------------------------------------
// RAG RETRIEVAL
//
// 1. Embed the user's question.
// 2. Fetch that user's stored transaction embeddings.
// 3. Calculate cosine similarity.
// 4. Sort by semantic relevance.
// 5. Return the top K transactions.
//
// For this college project, calculating cosine similarity in Node.js
// is perfectly acceptable for a small dataset.
//
// A production application could use pgvector, Pinecone, Weaviate,
// MongoDB Vector Search, etc.
// ---------------------------------------------------------------------

async function retrieveSimilar({
  userId,
  query,
  topK = 20,
}) {
  try {
    if (!userId || !query || !String(query).trim()) {
      return [];
    }

    const queryVector = await embed(query);

    if (!queryVector) {
      return [];
    }

    // Only retrieve embeddings belonging to the current user.
    // This prevents RAG from exposing another user's transactions.
    const embeddings =
      await TransactionEmbedding.find({
        userId,
      }).lean();

    if (!embeddings.length) {
      return [];
    }

    const scored = embeddings
      .map((embedding) => ({
        ...embedding,
        score: cosineSimilarity(
          queryVector,
          embedding.vector
        ),
      }))
      .filter(
        (embedding) =>
          Number.isFinite(embedding.score)
      );

    scored.sort(
      (a, b) => b.score - a.score
    );

    const safeTopK = Math.max(
      1,
      Math.min(Number(topK) || 20, 100)
    );

    const top = scored.slice(
      0,
      safeTopK
    );

    return top.map((embedding) => ({
      description: embedding.text,
      category:
        embedding.category ||
        "Uncategorized",
      amount:
        Number(embedding.amount) || 0,
      date:
        embedding.spentAt
          ?.toISOString?.()
          ?.slice(0, 10) ||
        "unknown",
      similarity:
        Math.round(
          embedding.score * 100
        ) / 100,
    }));
  } catch (err) {
    console.error(
      "retrieveSimilar failed (non-fatal):",
      err.message
    );

    return [];
  }
}

// ---------------------------------------------------------------------
// DELETE TRANSACTION EMBEDDING
//
// Removes the RAG record when the original transaction is deleted.
// ---------------------------------------------------------------------

async function deleteEmbedding(
  userId,
  transactionId
) {
  try {
    if (!userId || !transactionId) {
      return;
    }

    await TransactionEmbedding.deleteOne({
      userId,
      transactionId,
    });
  } catch (err) {
    console.error(
      "deleteEmbedding failed (non-fatal):",
      err.message
    );
  }
}

// ---------------------------------------------------------------------
// EXPORTS
// ---------------------------------------------------------------------

module.exports = {
  indexTransaction,
  retrieveSimilar,
  deleteEmbedding,
  embed,
  cosineSimilarity,
};