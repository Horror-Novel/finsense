import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

function NavLink({ href, children }) {
  const router = useRouter();
  const isActive = router.pathname === href || (href !== "/" && router.pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={`link-underline text-sm font-medium tracking-wide transition-colors ${
        isActive ? "text-forest-light" : "text-ink/60 hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <header className="glass sticky top-0 z-10 border-b border-line animate-fade-in">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href={user ? "/" : "/landing"} className="font-display text-xl font-semibold text-ink transition-transform hover:scale-[1.02]">
          Fin<span className="text-gradient font-bold">Sense</span>
        </Link>

        {user ? (
          <nav className="flex items-center gap-5">
            <NavLink href="/">Dashboard</NavLink>
            <NavLink href="/transactions">Transactions</NavLink>
            <NavLink href="/chat">Ask AI</NavLink>
            <NavLink href="/insights">Insights</NavLink>
            <NavLink href="/pricing">Pricing</NavLink>
            <div className="flex items-center gap-3 border-l border-line pl-5">
              <span
                className="flex items-center gap-1.5 text-xs text-ink/40"
                title={connected ? "Live sync active" : "Live sync offline"}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${connected ? "animate-pulse-dot bg-forest-light" : "bg-ink/20"}`} />
                {connected ? "Live" : "—"}
              </span>
              <span className="text-sm text-ink/50">{user.name}</span>
              <button
                onClick={handleLogout}
                className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink/70 transition-all hover:border-brick/50 hover:text-brick hover:-translate-y-0.5"
              >
                Log out
              </button>
            </div>
          </nav>
        ) : (
          <nav className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-ink/60 hover:text-ink transition-colors">Log in</Link>
            <Link href="/signup" className="btn-primary rounded-lg px-4 py-2 text-sm font-medium text-white">
              Get started
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
