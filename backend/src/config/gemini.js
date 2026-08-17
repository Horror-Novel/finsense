const { GoogleGenAI } = require("@google/genai");

// Shared Gemini client + model name — used by llm.service.js (chat +
// categorization) and agent.service.js (multi-step Budget Agent), so both
// features stay in sync if the model or API key ever changes.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";

module.exports = { ai, MODEL };
