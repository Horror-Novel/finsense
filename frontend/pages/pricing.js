import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import ErrorBanner from "../components/ErrorBanner";
import LoadingSpinner from "../components/LoadingSpinner";
import useScrollReveal from "../lib/useScrollReveal";

// SSR: pre-render the page structure (pricing tiers, feature lists) so
// search engines see the content without running client-side JS.
export async function getServerSideProps() {
  return {
    props: { renderedAt: new Date().toISOString() },
  };
}

// ─── How to test Pro without paying ───────────────────────────────────────
// Click the "Activate Test Pro (Dev)" button at the bottom of this page.
// It calls POST /api/payments/activate-test-pro which immediately upgrades
// your account with no Razorpay interaction. Only works in development.
// To test the REAL Razorpay flow, use Razorpay test mode.
// ─────────────────────────────────────────────────────────────────────────

export default function Pricing() {
  const { user } = useAuth();
  const router = useRouter();

  const [plan, setPlan] = useState("FREE");
  const [expiresAt, setExpiresAt] = useState(null);
  const [loading, setLoading] = useState(!!user);
  const [paying, setPaying] = useState(false);
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isDev = process.env.NODE_ENV !== "production";

  // Re-run the reveal logic after the async pricing content finishes loading.
  // Previously this ran only once before the pricing cards existed in the DOM.
  useScrollReveal([loading]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    api
      .get("/payments/plan")
      .then((res) => {
        setPlan(res.data.plan);
        setExpiresAt(res.data.expiresAt);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  async function handleUpgrade() {
    if (!user) {
      router.push("/signup");
      return;
    }

    setPaying(true);
    setError("");

    try {
      const orderRes = await api.post("/payments/create-order");
      const { orderId, amount, currency, razorpayKeyId } = orderRes.data;

      if (!window.Razorpay) {
        // Load Razorpay script lazily
        await new Promise((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://checkout.razorpay.com/v1/checkout.js";
          s.onload = resolve;
          s.onerror = reject;
          document.body.appendChild(s);
        });
      }

      const rzp = new window.Razorpay({
        key: razorpayKeyId,
        amount,
        currency,
        name: "FinSense",
        description: "Pro plan — 1 month",
        order_id: orderId,
        theme: { color: "#1FAE7B" },

        handler: async (response) => {
          try {
            await api.post("/payments/verify", {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            setPlan("PRO");
            setSuccess("🎉 You're now on Pro! Enjoy unlimited tracking.");
            setPaying(false);
          } catch (err) {
            setError(
              "Payment verification failed. Contact support if money was deducted."
            );
            setPaying(false);
          }
        },

        modal: {
          ondismiss: () => setPaying(false),
        },
      });

      rzp.open();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not start checkout. Is the payment gateway configured?"
      );
      setPaying(false);
    }
  }

  async function handleTestPro() {
    setActivating(true);
    setError("");

    try {
      const res = await api.post("/payments/activate-test-pro");

      setPlan("PRO");
      setSuccess(
        `✅ Test Pro activated until ${new Date(
          res.data.expiresAt
        ).toLocaleDateString()}. No real payment was made.`
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Test activation failed"
      );
    } finally {
      setActivating(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="animate-fade-in-up font-display text-center text-4xl font-bold text-ink">
        Simple, honest pricing
      </h1>

      <p
        className="animate-fade-in-up mt-3 text-center text-ink/50"
        style={{ animationDelay: "80ms" }}
      >
        Start free. Upgrade when you're ready for more.
      </p>

      <ErrorBanner message={error} />

      {success && (
        <div className="mt-4 animate-fade-in-up rounded-lg border border-forest/30 bg-forest/10 px-4 py-3 text-sm text-forest-light">
          {success}
        </div>
      )}

      {loading ? (
        <LoadingSpinner label="Loading your plan..." />
      ) : (
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {/* ── FREE ── */}
          <div
            data-reveal="left"
            className="relative overflow-hidden rounded-2xl border border-line bg-surface p-8"
          >
            <div className="card-accent-line" aria-hidden />

            <p className="text-xs font-medium uppercase tracking-wide text-ink/40">
              Free
            </p>

            <p className="mt-2 font-display text-4xl font-bold text-ink">
              ₹0
            </p>

            <p className="mt-1 text-sm text-ink/40">
              Forever
            </p>

            <ul className="mt-8 space-y-3 text-sm text-ink/70">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="text-forest-light">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            {plan === "FREE" && (
              <div className="mt-8 rounded-lg border border-line py-2 text-center text-sm text-ink/40">
                Current plan
              </div>
            )}
          </div>

          {/* ── PRO ── */}
          <div
            data-reveal="right"
            className="gradient-border-wrap"
          >
            <div className="relative overflow-hidden rounded-[0.9rem] bg-surface p-8">
              <p className="text-xs font-medium uppercase tracking-wide text-gold">
                Pro
              </p>

              <p className="mt-2 font-display text-4xl font-bold text-ink">
                ₹299
              </p>

              <p className="mt-1 text-sm text-ink/40">
                per month
              </p>

              <ul className="mt-8 space-y-3 text-sm text-ink/70">
                <li className="flex items-center gap-2">
                  <span className="text-forest-light">✓</span>
                  Everything in Free
                </li>

                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-gold">✦</span>
                    {f}
                  </li>
                ))}
              </ul>

              {plan === "PRO" ? (
                <div className="mt-8 rounded-lg border border-gold/30 bg-gold/10 py-2 text-center text-sm font-medium text-gold">
                  ✦ Active Pro · expires{" "}
                  {expiresAt
                    ? new Date(expiresAt).toLocaleDateString()
                    : "—"}
                </div>
              ) : (
                <button
                  onClick={handleUpgrade}
                  disabled={paying}
                  className="btn-primary mt-8 w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {paying
                    ? "Opening checkout..."
                    : "Upgrade to Pro →"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── FAQ ── */}
      <div className="mt-16 space-y-4" data-reveal>
        <h2 className="font-display text-2xl font-semibold text-ink">
          Frequently asked
        </h2>

        {FAQS.map((q) => (
          <details
            key={q.q}
            className="rounded-xl border border-line bg-surface p-4 text-sm"
          >
            <summary className="cursor-pointer font-medium text-ink">
              {q.q}
            </summary>

            <p className="mt-2 text-ink/60">
              {q.a}
            </p>
          </details>
        ))}
      </div>

      {/* ── DEV TEST BUTTON ── */}
      {isDev && user && plan !== "PRO" && (
        <div
          className="mt-12 rounded-xl border border-gold/20 bg-gold/5 p-6 text-center"
          data-reveal
        >
          <p className="mb-3 font-mono text-xs text-gold/70">
            🛠 DEVELOPMENT ONLY — bypasses Razorpay entirely
          </p>

          <p className="mb-4 text-sm text-ink/60">
            Use this to test Pro features without a real payment.
            <br />
            For Razorpay test mode, use card{" "}
            <code className="text-gold">
              4111 1111 1111 1111
            </code>
            , any expiry, CVV{" "}
            <code className="text-gold">123</code>, OTP{" "}
            <code className="text-gold">1234</code>.
          </p>

          <button
            onClick={handleTestPro}
            disabled={activating}
            className="rounded-lg border border-gold/40 bg-gold/10 px-6 py-2.5 text-sm font-medium text-gold transition-all hover:bg-gold/20 disabled:opacity-50"
          >
            {activating
              ? "Activating..."
              : "⚡ Activate Test Pro (Dev only)"}
          </button>
        </div>
      )}
    </div>
  );
}

const FREE_FEATURES = [
  "50 transactions per month",
  "AI auto-categorization",
  "Basic chat assistant",
  "Dashboard & analytics",
  "Receipt uploads",
];

const PRO_FEATURES = [
  "Unlimited transactions",
  "RAG-powered semantic chat",
  "Budget Health Agent (multi-step AI)",
  "Daily spending digests",
  "Priority AI response speed",
  "Export to CSV",
];

const FAQS = [
  {
    q: "Is the free plan really free forever?",
    a: "Yes — 50 transactions/month with full AI features at no cost, no credit card required.",
  },
  {
    q: "How do I test Pro features without paying?",
    a: "Choose the Pro plan and click 'Upgrade to Pro'. You'll be securely redirected to Razorpay to complete your payment.",
  },
  {
    q: "What happens when my Pro plan expires?",
    a: "Your data stays intact. You'll drop back to Free plan limits — no deletion, no surprises.",
  },
  {
    q: "Is my payment information secure?",
    a: "FinSense never sees your card details — Razorpay handles the payment entirely in their PCI-DSS compliant environment.",
  },
];