import { useEffect, useState, useCallback } from "react";
import ProtectedRoute from "../components/ProtectedRoute";
import api from "../lib/api";
import TransactionCard from "../components/TransactionCard";
import TransactionForm from "../components/TransactionForm";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBanner from "../components/ErrorBanner";
import { useSocket } from "../context/SocketContext";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sort, setSort] = useState("spentAt");
  const [liveFlash, setLiveFlash] = useState(false); // brief highlight when a live event arrives
  const { socket } = useSocket();

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { sort, order: "desc" };
      if (categoryFilter) params.categoryId = categoryFilter;

      const [txRes, catRes] = await Promise.all([
        api.get("/transactions", { params }),
        api.get("/categories"),
      ]);
      setTransactions(txRes.data.data);
      setCategories(catRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, sort]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // WEBSOCKET LIVE SYNC: if a transaction is created/updated/deleted from
  // ANOTHER tab or device (or by the AI via chat function-calling), these
  // events update this page instantly — no manual refresh, no polling.
  useEffect(() => {
    if (!socket) return;

    function flash() {
      setLiveFlash(true);
      setTimeout(() => setLiveFlash(false), 1200);
    }

    function handleCreated(tx) {
      setTransactions((prev) => {
        if (prev.some((t) => t.id === tx.id)) return prev; // avoid dupes from our own optimistic add
        return [tx, ...prev];
      });
      flash();
    }

    function handleUpdated(tx) {
      setTransactions((prev) => prev.map((t) => (t.id === tx.id ? tx : t)));
      flash();
    }

    function handleDeleted({ id }) {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      flash();
    }

    socket.on("transaction:created", handleCreated);
    socket.on("transaction:updated", handleUpdated);
    socket.on("transaction:deleted", handleDeleted);

    return () => {
      socket.off("transaction:created", handleCreated);
      socket.off("transaction:updated", handleUpdated);
      socket.off("transaction:deleted", handleDeleted);
    };
  }, [socket]);

  function handleCreated(newTransaction) {
    setTransactions((prev) => {
      if (prev.some((t) => t.id === newTransaction.id)) return prev;
      return [newTransaction, ...prev];
    });
  }

  async function handleDelete(id) {
    const prev = transactions;
    setTransactions((t) => t.filter((tx) => tx.id !== id));
    try {
      await api.delete(`/transactions/${id}`);
    } catch (err) {
      setTransactions(prev);
      setError("Failed to delete transaction");
    }
  }

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center gap-3">
        <h1 className="animate-fade-in-up font-display text-3xl font-semibold text-ink">Transactions</h1>
        {liveFlash && (
          <span className="animate-fade-in rounded-full bg-forest/15 px-2.5 py-1 text-xs font-medium text-forest-light">
            🔄 Synced from another session
          </span>
        )}
      </div>
      <p className="animate-fade-in-up mt-1 text-sm text-ink/50" style={{ animationDelay: "80ms" }}>
        Add an expense in plain English — AI will sort it for you.
      </p>

      <div className="mt-8 grid gap-8 md:grid-cols-[320px_1fr]">
        <TransactionForm categories={categories} onCreated={handleCreated} />

        <div>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink"
            >
              <option value="spentAt">Sort by date</option>
              <option value="amount">Sort by amount</option>
            </select>
          </div>

          <ErrorBanner message={error} />

          {loading ? (
            <LoadingSpinner label="Loading transactions..." />
          ) : transactions.length === 0 ? (
            <p className="mt-6 text-sm text-ink/40">No transactions match this filter.</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx, i) => (
                <TransactionCard key={tx.id} transaction={tx} onDelete={handleDelete} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </ProtectedRoute>
  );
}
