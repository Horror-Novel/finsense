import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";
import ErrorBanner from "../components/ErrorBanner";
import GoogleSignInButton from "../components/GoogleSignInButton";

export default function Signup() {
  const { signup } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const next = {};
    if (name.trim().length < 2) next.name = "Name must be at least 2 characters";
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "Enter a valid email";
    if (password.length < 6) next.password = "Password must be at least 6 characters";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!validate()) return;
    setSubmitting(true);
    try {
      await signup(name, email, password);
      router.push("/");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-6">
      <div className="pop-in gradient-border-wrap">
        <div className="rounded-[0.95rem] bg-paper px-8 py-9">
          <h1 className="font-display text-3xl font-semibold text-ink">Create your account</h1>
          <p className="mt-1 text-sm text-ink/50">Start tracking, let AI do the sorting.</p>
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink/60">Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm text-ink focus:border-forest" placeholder="Your name" />
              {fieldErrors.name && <p className="mt-1 text-xs text-brick">{fieldErrors.name}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink/60">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm text-ink focus:border-forest" placeholder="you@example.com" />
              {fieldErrors.email && <p className="mt-1 text-xs text-brick">{fieldErrors.email}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink/60">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm text-ink focus:border-forest" placeholder="At least 6 characters" />
              {fieldErrors.password && <p className="mt-1 text-xs text-brick">{fieldErrors.password}</p>}
            </div>
            <ErrorBanner message={error} />
            <button type="submit" disabled={submitting}
              className="btn-primary w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">
              {submitting ? "Creating account..." : "Sign up"}
            </button>
          </form>
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-line" /><span className="text-xs text-ink/30">or</span><div className="h-px flex-1 bg-line" />
          </div>
          <GoogleSignInButton />
          <p className="mt-6 text-center text-sm text-ink/50">
            Already have an account? <Link href="/login" className="link-underline font-medium text-forest-light">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
