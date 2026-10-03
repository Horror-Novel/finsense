import { useEffect, useState } from "react";
import ProtectedRoute from "../components/ProtectedRoute";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBanner from "../components/ErrorBanner";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import HoistingDemo from "../components/HoistingDemo";
import EventLoopDemo from "../components/EventLoopDemo";

const fmt = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

// SSR NOTE: getServerSideProps runs on the server for every request.
// It could verify the session cookie and pre-fetch the summary data so
// the page renders with real content on the first HTML response — great
// for SEO (search engines see real data) and first-paint speed (no
// loading spinner flash). For this project, we use it to demonstrate the
// SSR concept; the actual data fetch happens client-side after hydration
// so we don't need to pass the JWT server-to-server.
export async function getServerSideProps() {
  // In production you'd parse the cookie/header here and fetch data.
  // For the demo, we return static SSR metadata so the page title and
  // meta description are correct in the initial HTML the server sends.
  return {
    props: {
      ssrTimestamp: new Date().toISOString(),
    },
  };
}

export default function Dashboard({ ssrTimestamp }) {
  const { user } = useAuth();
  const [summary, setSummary] = useState([]);
  const [usage, setUsage] = useState(null);
  const [plan, setPlan] = useState("FREE");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [barsReady, setBarsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [sumRes, usageRes, planRes] = await Promise.all([
          api.get("/transactions/summary"),
          api.get("/chat/usage"),
          api.get("/payments/plan"),
        ]);
        if (!cancelled) {
          setSummary(sumRes.data.data);
          setUsage(usageRes.data.totals);
          setPlan(planRes.data.plan);
        }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || "Failed to load dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!loading && summary.length > 0) {
      const t = setTimeout(() => setBarsReady(true), 80);
      return () => clearTimeout(t);
    }
  }, [loading, summary]);

  const total = summary.reduce((sum, s) => sum + s.total, 0);
  const maxCat = Math.max(...summary.map((s) => s.total), 1);

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="animate-fade-in-up font-display text-3xl font-semibold text-ink">
              Hey {user?.name?.split(" ")[0]} 👋
            </h1>
            <p className="animate-fade-in-up mt-1 text-sm text-ink/50" style={{ animationDelay: "80ms" }}>
              Here's where your money has been going.
            </p>
          </div>
          {plan === "PRO" ? (
            <span className="glow-badge rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">
              ✦ Pro
            </span>
          ) : (
            <a href="/pricing" className="rounded-full border border-line px-3 py-1 text-xs text-ink/40 hover:text-forest-light transition-colors">
              Upgrade to Pro →
            </a>
          )}
        </div>

        <ErrorBanner message={error} />

        {loading ? (
          <LoadingSpinner label="Loading dashboard..." />
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="stagger-in card-hover relative overflow-hidden rounded-xl border border-line bg-surface p-6 md:col-span-1">
              <div className="card-accent-line" aria-hidden />
              <p className="text-xs font-medium uppercase tracking-wide text-ink/40">Total spent</p>
              <p className="mt-2 font-mono text-3xl font-semibold text-ink">{fmt.format(total)}</p>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-forest-light">
                <span className="float-shape">✨</span>
                <span>AI-tagged spending updates live</span>
              </div>
            </div>

            <div className="stagger-in card-hover relative overflow-hidden rounded-xl border border-line bg-surface p-6 md:col-span-2" style={{ "--delay": "100ms" }}>
              <div className="card-accent-line" aria-hidden />
              <p className="mb-4 text-xs font-medium uppercase tracking-wide text-ink/40">Spending by category</p>
              {summary.length === 0 ? (
                <p className="text-sm text-ink/40">No expenses yet — add your first on the Transactions page.</p>
              ) : (
                <div className="space-y-3">
                  {[...summary].sort((a, b) => b.total - a.total).map((s, i) => (
                    <div key={s.category} className="stagger-in flex items-center gap-3" style={{ "--delay": `${150 + i * 60}ms` }}>
                      <span className="w-24 shrink-0 text-sm text-ink/70">{s.category}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-paper">
                        <div className="bar-fill h-full rounded-full bg-gradient-to-r from-forest to-forest-light" style={{ width: barsReady ? `${(s.total / maxCat) * 100}%` : "0%" }} />
                      </div>
                      <span className="w-20 shrink-0 text-right font-mono text-sm text-ink/70">{fmt.format(s.total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {usage && (
              <div className="stagger-in card-hover relative col-span-full overflow-hidden rounded-xl border border-line bg-surface p-6" style={{ "--delay": "200ms" }}>
                <div className="card-accent-line" aria-hidden />
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink/40">AI usage (token & cost monitoring)</p>
                <div className="flex flex-wrap gap-8 text-sm text-ink/70">
                  <span>Input tokens: <span className="font-mono text-ink">{usage.inputTokens}</span></span>
                  <span>Output tokens: <span className="font-mono text-ink">{usage.outputTokens}</span></span>
                  <span>Est. cost: <span className="font-mono text-ink">${usage.estCostUsd.toFixed(4)}</span></span>
                </div>
              </div>
            )}
            
            <HoistingDemo />
            <EventLoopDemo />
          </div>
        )}

        <p className="mt-6 text-right text-xs text-ink/20">
          Page rendered server-side at {new Date(ssrTimestamp).toLocaleTimeString()}
        </p>
      </div>
    </ProtectedRoute>
  );
}
