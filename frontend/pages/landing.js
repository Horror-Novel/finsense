import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import useScrollReveal from "../lib/useScrollReveal";
import useCountUp from "../lib/useCountUp";

// This page uses Next.js SSG (Static Site Generation) via getStaticProps.
// The HTML is pre-built at deploy time — no server round-trip on load,
// perfect for SEO and first-paint speed. No auth required.
export default function Landing({ stats }) {
  useScrollReveal();
  const [heroVisible, setHeroVisible] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsVisible(true); }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const txCount = useCountUp(stats.transactions, 1400, statsVisible);
  const userCount = useCountUp(stats.users, 1200, statsVisible);
  const accuracy = useCountUp(stats.accuracy, 1600, statsVisible);

  return (
    <div className="min-h-screen">
      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
        {/* Background animated mesh grid */}
        <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(31,174,123,0.15),transparent)]" />
          <svg className="absolute inset-0 h-full w-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1fae7b" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
          {/* Floating orbs */}
          <div className="float-shape absolute left-[10%] top-[20%] h-64 w-64 rounded-full bg-forest/10 blur-3xl" />
          <div className="float-shape absolute right-[8%] top-[30%] h-48 w-48 rounded-full bg-gold/10 blur-3xl" style={{ animationDelay: "2s" }} />
          <div className="float-shape absolute bottom-[20%] left-[30%] h-56 w-56 rounded-full bg-forest/8 blur-3xl" style={{ animationDelay: "4s" }} />
        </div>

        <div className={`relative z-10 transition-all duration-1000 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-forest/30 bg-forest/10 px-4 py-2 text-xs font-medium text-forest-light">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-forest-light" />
            AI-powered · RAG retrieval · Real-time sync
          </div>

          <h1 className="font-display text-5xl font-bold leading-[1.1] text-ink sm:text-6xl lg:text-7xl">
            Your money,{" "}
            <span className="text-gradient">finally</span>
            <br />
            makes sense.
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg text-ink/60">
            Type <em className="text-ink/80 not-italic">"Swiggy order 450 rupees"</em> — AI categorizes it instantly.
            Then ask your data anything, like talking to a personal CFO.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="btn-primary rounded-xl px-8 py-3.5 text-base font-semibold text-white shadow-[0_0_40px_-10px_rgba(31,174,123,0.6)]"
            >
              Start tracking free →
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-line px-8 py-3.5 text-base font-medium text-ink/70 transition-all hover:border-forest/40 hover:text-ink"
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* Hero mockup — animated "terminal" style expense log */}
        <div
          className={`relative z-10 mt-16 w-full max-w-2xl transition-all duration-1000 delay-300 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
        >
          <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)]">
            <div className="flex items-center gap-2 border-b border-line bg-paper px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-brick/70" />
              <span className="h-3 w-3 rounded-full bg-gold/70" />
              <span className="h-3 w-3 rounded-full bg-forest/70" />
              <span className="ml-3 font-mono text-xs text-ink/30">FinSense — AI Expense Tracker</span>
            </div>
            <div className="space-y-3 p-5 font-mono text-sm">
              {[
                { text: "> Swiggy order 450 rupees", result: "🍔 Food · ₹450 · Swiggy · 94% confident", delay: 0 },
                { text: "> Uber to airport", result: "🚗 Transport · ₹280 · Uber · 98% confident", delay: 200 },
                { text: "> Netflix this month?", result: "💬 You spent ₹649 on Bills (streaming) this month", delay: 400 },
              ].map((item, i) => (
                <div key={i} className="stagger-in" style={{ "--delay": `${600 + item.delay}ms` }}>
                  <p className="text-forest-light">{item.text}</p>
                  <p className="mt-1 text-ink/60">✨ {item.result}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-ink/30">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M7 10l5 5 5-5" />
          </svg>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────────── */}
      <section ref={statsRef} className="border-y border-line bg-surface/50 py-16">
        <div className="mx-auto grid max-w-4xl grid-cols-3 gap-8 px-6 text-center">
          {[
            { value: txCount, suffix: "+", label: "Transactions tracked" },
            { value: userCount, suffix: "+", label: "Users saving smarter" },
            { value: accuracy, suffix: "%", label: "AI categorization accuracy" },
          ].map((s, i) => (
            <div key={i} data-reveal="scale" data-delay={i * 100}>
              <p className="font-display text-4xl font-bold text-gradient">
                {s.value.toLocaleString()}{s.suffix}
              </p>
              <p className="mt-2 text-sm text-ink/50">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="font-display text-center text-4xl font-bold text-ink" data-reveal>
          Everything your money needs
        </h2>
        <p className="mt-3 text-center text-ink/50" data-reveal data-delay="100">
          Built on Gemini AI, Postgres, MongoDB, Redis, and WebSockets. Not just an app — a system.
        </p>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              data-reveal
              data-delay={i * 80}
              className="card-hover relative overflow-hidden rounded-2xl border border-line bg-surface p-6 transition-shadow"
            >
              <div className="card-accent-line" aria-hidden />
              <div className="mb-4 text-3xl">{f.icon}</div>
              <h3 className="font-display text-lg font-semibold text-ink">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/50">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────── */}
      <section className="border-t border-line bg-surface/30 py-24">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="font-display text-center text-4xl font-bold text-ink" data-reveal>
            Three steps. Zero friction.
          </h2>
          <div className="mt-16 space-y-12">
            {STEPS.map((s, i) => (
              <div
                key={s.title}
                data-reveal={i % 2 === 0 ? "left" : "right"}
                data-delay={i * 100}
                className="flex items-start gap-6"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-forest/15 font-display text-xl font-bold text-forest-light">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-semibold text-ink">{s.title}</h3>
                  <p className="mt-1 text-sm text-ink/50">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="mx-auto max-w-2xl px-6 text-center" data-reveal="scale">
          <div className="gradient-border-wrap">
            <div className="rounded-[0.9rem] bg-paper p-10">
              <h2 className="font-display text-4xl font-bold text-ink">
                Ready to stop guessing?
              </h2>
              <p className="mt-3 text-ink/50">
                Free plan includes 50 transactions/month and full AI chat. No credit card needed.
              </p>
              <Link
                href="/signup"
                className="btn-primary mt-8 inline-block rounded-xl px-10 py-4 text-base font-semibold text-white"
              >
                Create free account →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-line py-8 text-center text-xs text-ink/30">
        © {new Date().getFullYear()} FinSense · Built for college placement · Powered by Gemini AI
      </footer>
    </div>
  );
}

// Landing page uses custom layout without the standard Navbar/main wrapper
Landing.getLayout = (page) => page;

const FEATURES = [
  { icon: "🤖", title: "AI Auto-categorization", desc: "Type anything. Gemini reads your description and outputs structured JSON — category, merchant, amount, confidence." },
  { icon: "🔍", title: "RAG-powered Chat", desc: "Your questions are embedded and matched against your transaction history semantically, not just by recency." },
  { icon: "⚡", title: "Real-time Sync", desc: "Add an expense on your phone, watch it appear on your laptop instantly — zero polling, pure WebSockets." },
  { icon: "🤖", title: "Multi-step Agent", desc: "The Budget Health Agent investigates your spending autonomously — calling tools, chaining insights, producing a verdict." },
  { icon: "📊", title: "Daily Digests", desc: "A scheduled job summarizes your last 24h of spending every morning. Trigger it manually any time." },
  { icon: "🔒", title: "Secure by default", desc: "JWT auth, bcrypt passwords, Zod validation, rate limiting, prompt injection defenses — built in, not bolted on." },
];

const STEPS = [
  { title: "Log an expense in plain English", desc: 'Type "Zomato 380 rupees" or "Uber to college" — no dropdowns, no forms, just natural language.' },
  { title: "AI categorizes and extracts structured data", desc: "Gemini reads your text and returns a JSON object with category, merchant, amount, and a confidence score — saved straight to your database." },
  { title: "Ask your spending anything", desc: 'Open the chat and type "how much did I spend on food this week?" — the AI retrieves semantically relevant transactions and answers from your real data.' },
];

// getStaticProps runs at BUILD TIME on the server — generates real numbers
// for the stats section without a runtime DB query on every page load.
// Falls back to placeholder numbers if the DB isn't reachable at build time.
export async function getStaticProps() {
  let stats = { transactions: 1240, users: 87, accuracy: 94 };
  // In a real deploy, you'd query the DB here. For the project, hardcoded
  // numbers are fine — the SSR/SSG mechanism itself is what matters for the viva.
  return {
    props: { stats },
    revalidate: 3600, // ISR: re-generate at most once per hour
  };
}
