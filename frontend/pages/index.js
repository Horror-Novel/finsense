import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import Dashboard from "./dashboard";

// The root "/" renders the Dashboard for logged-in users and redirects to
// /landing for everyone else. This is a client-side check — the dashboard's
// own getServerSideProps handles the authoritative server-side guard.
export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/landing");
    }
  }, [user, loading, router]);

  if (loading) return <LoadingSpinner label="Loading..." />;
  if (!user) return null;
  return <Dashboard />;
}

// Use the standard layout (Navbar + main)
Index.getLayout = undefined;
