import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";

// Renders Google's own "Sign in with Google" button via the Google
// Identity Services script, loaded lazily on mount rather than in
// index.html, so the app works fine even if this component never mounts.
// If NEXT_PUBLIC_GOOGLE_CLIENT_ID isn't set, this quietly renders a small note
// instead of a broken button — OAuth is an optional feature, not a
// hard requirement to run the app.
export default function GoogleSignInButton() {
  const { loginWithGoogle } = useAuth();
  const router = useRouter();
  const buttonRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) return;

    if (window.google?.accounts?.id) {
      setReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setReady(true);
    document.body.appendChild(script);
  }, [clientId]);

  useEffect(() => {
    if (!ready || !buttonRef.current || !clientId) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response) => {
        try {
          await loginWithGoogle(response.credential);
          router.push("/");
        } catch (err) {
          setError("Google sign-in failed. Please try again or use email/password.");
        }
      },
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "filled_black",
      size: "large",
      width: 320,
      shape: "pill",
    });
  }, [ready, clientId, loginWithGoogle, router]);

  if (!clientId) {
    return (
      <p className="text-center text-xs text-ink/30">
        Google sign-in isn't configured — add <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> to enable it.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div ref={buttonRef} />
      {error && <p className="text-xs text-brick">{error}</p>}
    </div>
  );
}
