import { useEffect, useRef, useState } from "react";
import ProtectedRoute from "../components/ProtectedRoute";
import api from "../lib/api";
import ChatBubble from "../components/ChatBubble";
import LoadingSpinner from "../components/LoadingSpinner";
import { useRateLimiter } from "../lib/useClosures";
import ErrorBanner from "../components/ErrorBanner";

/*
 * Streams an AI response from the backend.
 *
 * PROMISE:
 * Because this function is async, it returns a Promise.
 * The Promise represents the completion/failure of the entire
 * streaming operation.
 *
 * CALLBACK:
 * onToken is called whenever a new token/chunk arrives.
 * This lets the UI update incrementally instead of waiting
 * for the entire AI response.
 *
 * EVENT LOOP:
 * reader.read() is asynchronous. While the browser waits for
 * another network chunk, JavaScript can continue processing
 * other UI work instead of blocking the page.
 */
async function streamChatResponse(question, onToken, onToolCall) {
  const token = localStorage.getItem("finsense_token");

  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ question }),
  });

  if (!response.ok || !response.body) {
    throw new Error("Chat request failed");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";

  while (true) {
    /*
     * Awaiting the next network chunk does not block the browser.
     * The JavaScript event loop remains free to process UI events,
     * React updates, rendering, and other asynchronous work.
     */
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) {
        continue;
      }

      const payload = JSON.parse(line.slice(6));

      if (payload.token) {
        /*
         * CALLBACK:
         * The caller supplied onToken(), so this function
         * can notify the UI whenever another piece arrives.
         */
        onToken(payload.token);
      }

      // FUNCTION CALLING: fired once, before the streamed text, whenever
      // Gemini decided to call one of our tools (see llm.service.js /
      // tools.service.js) to look up real data before answering.
      if (payload.toolCall) {
        onToolCall?.(payload.toolCall);
      }

      if (payload.error) {
        throw new Error(payload.error);
      }
    }
  }

  /*
   * The async function resolves its Promise when the complete
   * stream has finished.
   */
  return true;
}

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");
  const [clearing, setClearing] = useState(false);

  const bottomRef = useRef(null);

  // CLOSURE IN ACTION: useRateLimiter returns a closure — a function that
  // remembers its internal `calls` array across every render of this
  // component. Each call to isAllowed() reads and mutates that closed-over
  // array to decide whether the user has sent too many messages too quickly.
  // The `calls` array is private to THIS component instance — another Chat
  // component would get its own separate closure with its own `calls` array.
  const isAllowed = useRateLimiter(10, 60000); // 10 messages per minute

  useEffect(() => {
    api
      .get("/chat/history")
      .then((res) => setMessages(res.data.data))
      .catch(() => setError("Failed to load chat history"))
      .finally(() => setLoadingHistory(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();

    const question = input.trim();

    if (!question || streaming) {
      return;
    }

    // CLOSURE USED HERE: isAllowed() reads and updates a `calls` array that
    // lives inside the closure — this component never sees that array directly.
    if (!isAllowed()) {
      setError("You're sending messages too fast — wait a moment and try again.");
      return;
    }

    setError("");
    setInput("");

    // Add the user's question immediately.
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: question,
      },
    ]);

    // Add an empty assistant message that will be filled
    // incrementally as tokens arrive.
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: "",
      },
    ]);

    setStreaming(true);

    try {
      /*
       * streamChatResponse() returns a Promise.
       *
       * await means:
       * "Wait for the complete streaming operation to finish."
       *
       * The onToken callback handles individual pieces
       * of the response while that Promise is pending.
       */
      await streamChatResponse(
        question,
        (token) => {
          setMessages((prev) => {
            const next = [...prev];

            const lastMessage = next[next.length - 1];

            if (!lastMessage) {
              return prev;
            }

            next[next.length - 1] = {
              ...lastMessage,
              content: lastMessage.content + token,
            };

            return next;
          });
        },
        (toolCall) => {
          // Attach the tool call info to the in-progress assistant message
          // so ChatBubble can render a small "🔧 used a tool" indicator —
          // visible, concrete proof that function calling actually ran.
          setMessages((prev) => {
            const next = [...prev];
            const lastMessage = next[next.length - 1];
            if (!lastMessage) return prev;
            next[next.length - 1] = { ...lastMessage, toolCall };
            return next;
          });
        }
      );
    } catch (err) {
      setError(
        err.message || "Something went wrong talking to the AI assistant."
      );
    } finally {
      /*
       * The Promise has either resolved or rejected,
       * so the streaming operation is finished.
       */
      setStreaming(false);
    }
  }

  function handleDeleted(id) {
    setMessages((prev) => prev.filter((msg) => msg._id !== id));
  }

  function handleStarredChange(id, starred) {
    setMessages((prev) =>
      prev.map((msg) =>
        msg._id === id ? { ...msg, starred } : msg
      )
    );
  }

  async function handleClearHistory() {
    if (clearing || messages.length === 0) {
      return;
    }

    setClearing(true);

    try {
      await api.delete("/chat/history");
      setMessages([]);
    } catch {
      setError("Failed to clear chat history");
    } finally {
      setClearing(false);
    }
  }

  return (
    <ProtectedRoute>
      <div className="mx-auto flex h-[calc(100vh-73px)] max-w-3xl flex-col px-6 py-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="animate-fade-in-up font-display text-2xl font-semibold text-ink">
            Ask FinSense
          </h1>

          <p
            className="animate-fade-in-up mt-1 text-sm text-ink/50"
            style={{ animationDelay: "80ms" }}
          >
            Ask about your own spending — e.g. "How much did I spend on food
            this month?"
          </p>
        </div>

        {messages.length > 0 && (
          <button
            onClick={handleClearHistory}
            disabled={clearing}
            className="mt-1 text-xs text-ink/40 transition-colors hover:text-brick disabled:opacity-50"
          >
            {clearing ? "Clearing..." : "Clear conversation"}
          </button>
        )}
      </div>

      <div className="mt-6 flex-1 space-y-5 overflow-y-auto rounded-2xl border border-line/40 glass p-6 shadow-[inset_0_0_20px_rgba(0,0,0,0.2)]">
        {loadingHistory ? (
          <LoadingSpinner label="Loading conversation..." />
        ) : messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink/40">
            No messages yet — ask your first question below.
          </p>
        ) : (
          messages.map((m, i) => (
            <ChatBubble
              key={m._id || i}
              id={m._id}
              role={m.role}
              content={m.content}
              starred={m.starred}
              toolCall={m.toolCall}
              onDeleted={handleDeleted}
              onStarredChange={handleStarredChange}
            />
          ))
        )}

        <div ref={bottomRef} />
      </div>

      <ErrorBanner message={error} />

      <form onSubmit={handleSend} className="mt-4 flex gap-3 p-2 rounded-2xl glass border border-line/50 items-center shadow-lg transition-all duration-300 focus-within:border-forest/50 focus-within:shadow-[0_0_25px_rgba(31,174,123,0.15)]">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your spending..."
          disabled={streaming}
          className="flex-1 bg-transparent px-4 py-2 text-[15px] text-ink outline-none placeholder:text-ink/40 disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={streaming || !input.trim()}
          className="btn-primary rounded-xl px-7 py-3 text-sm font-semibold tracking-wide text-white disabled:opacity-50 shadow-md transition-all hover:shadow-[0_0_15px_rgba(31,174,123,0.4)]"
        >
          {streaming ? "Thinking..." : "Send"}
        </button>
      </form>
    </div>
    </ProtectedRoute>
  );
}
