import { useState } from "react";
import api from "../lib/api";

const TOOL_LABELS = {
  get_spending_summary: "Checked your spending summary",
  get_category_comparison: "Compared this month vs. last month",
  get_recent_transactions: "Looked up recent transactions",
  create_transaction: "Logged a new expense",
};

export default function ChatBubble({ id, role, content, starred, toolCall, onDeleted, onStarredChange }) {
  const isUser = role === "user";
  const [busy, setBusy] = useState(false);

  async function toggleStar() {
    if (!id || busy) return;
    setBusy(true);
    try {
      const res = await api.patch(`/chat/history/${id}`, { starred: !starred });
      onStarredChange?.(id, res.data.data.starred);
    } catch {
      // silently ignore — starring is a nice-to-have, not critical
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!id || busy) return;
    setBusy(true);
    try {
      await api.delete(`/chat/history/${id}`);
      onDeleted?.(id);
    } catch {
      // ignore
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={`group flex flex-col gap-1 ${isUser ? "items-end" : "items-start"} animate-fade-in-up`}
    >
      {!isUser && toolCall && (
        <span className="glow-badge ml-1 inline-flex items-center gap-1 text-xs text-gold">
          🔧 {TOOL_LABELS[toolCall.name] || `Used tool: ${toolCall.name}`}
        </span>
      )}

      <div className={`flex items-center gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
        {!isUser && id && (
          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={toggleStar}
              disabled={busy}
              title={starred ? "Unstar" : "Star this answer"}
              className={`text-xs transition-transform hover:scale-125 ${
                starred ? "text-gold" : "text-ink/30"
              }`}
            >
              {starred ? "★" : "☆"}
            </button>
            <button
              onClick={handleDelete}
              disabled={busy}
              title="Delete message"
              className="text-xs text-ink/30 transition-colors hover:text-brick"
            >
              ✕
            </button>
          </div>
        )}

        <div
          className={`max-w-[85%] rounded-[20px] px-5 py-3.5 text-[15px] leading-relaxed transition-all duration-300 hover:scale-[1.01] ${
            isUser
              ? "bg-gradient-to-tr from-[#1fae7b] to-[#128a5f] text-white shadow-[0_8px_20px_-6px_rgba(31,174,123,0.6)] font-medium rounded-br-sm"
              : "border border-line/40 glass text-[#eaf2ee] shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-md rounded-bl-sm"
          }`}
        >
          {content || (
            <span className="dot-flashing text-ink/40">
              <span />
              <span />
              <span />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}