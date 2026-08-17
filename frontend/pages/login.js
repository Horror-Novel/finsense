import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";
import ErrorBanner from "../components/ErrorBanner";
import GoogleSignInButton from "../components/GoogleSignInButton";

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      router.push("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-6">
      <div className="pop-in gradient-border-wrap">
        <div className="rounded-[0.95rem] bg-paper px-8 py-9">
          <h1 className="font-display text-3xl font-semibold text-ink">Welcome back</h1>
          <p className="mt-1 text-sm text-ink/50">Log in to see where your money went.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink/60">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm text-ink focus:border-forest" placeholder="you@example.com" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink/60">Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm text-ink focus:border-forest" placeholder="••••••••" />
            </div>
            <ErrorBanner message={error} />
            <button type="submit" disabled={submitting}
              className="btn-primary w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">
              {submitting ? "Logging in..." : "Log in"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-line" /><span className="text-xs text-ink/30">or</span><div className="h-px flex-1 bg-line" />
          </div>
          <GoogleSignInButton />

          <p className="mt-6 text-center text-sm text-ink/50">
            New here? <Link href="/signup" className="link-underline font-medium text-forest-light">Create an account</Link>
          </p>
          <p className="mt-4 rounded-lg border border-line bg-surface px-4 py-3 text-center text-xs text-ink/40">
            Demo: <span className="font-mono text-ink/60">demo@finsense.app / demo1234</span>
          </p>
        </div>
      </div>
    </div>
  );
}
