import { useEffect, useState } from "react";
import ProtectedRoute from "../components/ProtectedRoute";
import api from "../lib/api";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBanner from "../components/ErrorBanner";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const TOOL_LABELS = {
  get_spending_summary: "Getting spending summary",
  get_category_comparison: "Comparing this month vs. last month",
  get_recent_transactions: "Looking up recent transactions",
};

const VERDICT_STYLES = {
  "looking healthy": "bg-forest/15 text-forest-light border-forest/30",
  "worth watching": "bg-gold/15 text-gold border-gold/30",
  "needs attention": "bg-surface text-ink/90 border-line shadow-sm",
};

function verdictStyle(report) {
  const lower = report.toLowerCase();
  for (const key of Object.keys(VERDICT_STYLES)) {
    if (lower.includes(key)) return VERDICT_STYLES[key];
  }
  return "bg-surface text-ink/70 border-line";
}

export default function Insights() {
  // --- Budget Health Agent (multi-step agent) ---
  const [agentTrace, setAgentTrace] = useState([]);
  const [agentReport, setAgentReport] = useState("");
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentError, setAgentError] = useState("");

  // --- Scheduled digests (cron) ---
  const [digests, setDigests] = useState([]);
  const [digestsLoading, setDigestsLoading] = useState(true);
  const [generatingDigest, setGeneratingDigest] = useState(false);
  const [digestMessage, setDigestMessage] = useState("");

  // --- Chat stats (Mongo aggregation pipeline) ---
  const [chatStats, setChatStats] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    loadDigests();
    loadChatStats();
  }, []);

  async function loadDigests() {
    setDigestsLoading(true);
    try {
      const res = await api.get("/digests");
      setDigests(res.data.data);
    } catch {
      /* non-critical widget — fail quietly */
    } finally {
      setDigestsLoading(false);
    }
  }

  async function loadChatStats() {
    setStatsLoading(true);
    try {
      const res = await api.get("/chat/stats");
      setChatStats(res.data.data);
    } catch {
      /* non-critical widget — fail quietly */
    } finally {
      setStatsLoading(false);
    }
  }

  async function runAgent() {
    setAgentRunning(true);
    setAgentError("");
    setAgentTrace([]);
    setAgentReport("");
    try {
      const res = await api.post("/agent/analyze");
      setAgentTrace(res.data.trace.filter((s) => s.type !== "final"));
      setAgentReport(res.data.report);
    } catch (err) {
      setAgentError(err.response?.data?.message || "The agent run failed. Please try again.");
    } finally {
      setAgentRunning(false);
    }
  }

  async function generateDigestNow() {
    setGeneratingDigest(true);
    setDigestMessage("");
    try {
      const res = await api.post("/digests/run-now");
      setDigestMessage(res.data.message);
      await loadDigests();
    } catch (err) {
      setDigestMessage(err.response?.data?.message || "Failed to generate digest");
    } finally {
      setGeneratingDigest(false);
    }
  }

  const maxChatMessages = Math.max(...chatStats.map((s) => s.totalMessages), 1);

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="animate-fade-in-up font-display text-3xl font-semibold text-ink">Insights</h1>
      <p className="animate-fade-in-up mt-1 text-sm text-ink/50" style={{ animationDelay: "80ms" }}>
        Deeper analysis — an autonomous budget agent, scheduled digests, and your chat activity.
      </p>

      {/* ================= Budget Health Agent ================= */}
      <section className="stagger-in card-hover relative mt-8 overflow-hidden rounded-xl border border-line bg-surface p-6">
        <div className="card-accent-line" aria-hidden />
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">Budget Health Agent</h2>
            <p className="mt-1 text-sm text-ink/50">
              A multi-step AI agent that investigates your spending on its own — deciding which tools
              to call, in what order — then reports back.
            </p>
          </div>
          <button
            onClick={runAgent}
            disabled={agentRunning}
            className="btn-primary shrink-0 rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {agentRunning ? "Analyzing..." : "Run analysis"}
          </button>
        </div>

        <ErrorBanner message={agentError} />

        {agentRunning && (
          <div className="mt-4">
            <LoadingSpinner label="Agent is investigating your spending..." />
          </div>
        )}

        {!agentRunning && agentTrace.length > 0 && (
          <div className="mt-6 space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-ink/40">Agent trace</p>
            {agentTrace
              .filter((s) => s.type === "tool_call")
              .map((step, i) => (
                <div
                  key={i}
                  className="stagger-in flex items-center gap-2 rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink/70"
                  style={{ "--delay": `${i * 80}ms` }}
                >
                  <span className="text-forest-light">Step {step.step}</span>
                  <span>🔧</span>
                  <span>{TOOL_LABELS[step.name] || step.name}</span>
                  {step.args && Object.keys(step.args).length > 0 && (
                    <span className="ml-auto font-mono text-xs text-ink/30">
                      {JSON.stringify(step.args)}
                    </span>
                  )}
                </div>
              ))}
          </div>
        )}

        {!agentRunning && agentReport && (
          <div className={`pop-in mt-6 rounded-lg border p-4 text-sm leading-relaxed ${verdictStyle(agentReport)}`}>
            <p className="whitespace-pre-line">{agentReport}</p>
          </div>
        )}

        {!agentRunning && !agentReport && agentTrace.length === 0 && !agentError && (
          <p className="mt-4 text-sm text-ink/40">
            Click "Run analysis" — the agent will look up your spending summary, compare months, and
            check recent transactions before giving you a verdict.
          </p>
        )}
      </section>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {/* ================= Scheduled Digests ================= */}
        <section
          className="stagger-in card-hover relative overflow-hidden rounded-xl border border-line bg-surface p-6"
          style={{ "--delay": "100ms" }}
        >
          <div className="card-accent-line" aria-hidden />
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink">Spending Digests</h2>
            <button
              onClick={generateDigestNow}
              disabled={generatingDigest}
              className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-ink/70 transition-all hover:border-forest/40 hover:text-forest-light disabled:opacity-50"
            >
              {generatingDigest ? "Generating..." : "Generate now"}
            </button>
          </div>
          <p className="mt-1 text-xs text-ink/40">
            A scheduled job runs daily at 08:00 and summarizes the last 24 hours of spending. Use
            "Generate now" to trigger it on demand instead of waiting.
          </p>

          {digestMessage && <p className="mt-2 text-xs text-forest-light">{digestMessage}</p>}

          {digestsLoading ? (
            <LoadingSpinner label="Loading digests..." />
          ) : digests.length === 0 ? (
            <p className="mt-4 text-sm text-ink/40">No digests yet — try "Generate now".</p>
          ) : (
            <div className="mt-4 space-y-2">
              {digests.map((d) => (
                <div key={d._id} className="rounded-lg border border-line bg-paper px-3 py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-ink/70">{d.periodLabel}</span>
                    <span className="font-mono text-ink">{currencyFormatter.format(d.totalSpent)}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-ink/40">
                    Top category: {d.topCategory || "—"} · {d.transactionCount} transaction
                    {d.transactionCount === 1 ? "" : "s"} ·{" "}
                    {d.generatedBy === "cron" ? "🕐 scheduled" : "⚡ manual"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ================= Chat Activity (Mongo aggregation) ================= */}
        <section
          className="stagger-in card-hover relative overflow-hidden rounded-xl border border-line bg-surface p-6"
          style={{ "--delay": "150ms" }}
        >
          <div className="card-accent-line" aria-hidden />
          <h2 className="font-display text-lg font-semibold text-ink">Chat Activity</h2>
          <p className="mt-1 text-xs text-ink/40">
            Computed with a MongoDB aggregation pipeline — grouped, counted, and averaged entirely
            inside the database.
          </p>

          {statsLoading ? (
            <LoadingSpinner label="Loading chat stats..." />
          ) : chatStats.length === 0 ? (
            <p className="mt-4 text-sm text-ink/40">No chat activity yet — ask FinSense a question.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {chatStats.map((s) => (
                <div key={s.date} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 text-xs text-ink/50">{s.date}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-paper">
                    <div
                      className="bar-fill h-full rounded-full bg-gradient-to-r from-gold to-forest-light"
                      style={{ width: `${(s.totalMessages / maxChatMessages) * 100}%` }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right font-mono text-xs text-ink/60">
                    {s.totalMessages}
                  </span>
                  {s.starredCount > 0 && (
                    <span className="shrink-0 text-xs text-gold" title="Starred messages">
                      ★{s.starredCount}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
    </ProtectedRoute>
  );
}
