import CategoryBadge from "./CategoryBadge";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const API_ORIGIN =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_BASE
    ? process.env.NEXT_PUBLIC_API_BASE
    : ""
  ).replace(/\/api\/?$/, "");

function resolveReceiptUrl(transaction) {
  const raw = transaction.receiptUrl || transaction.receiptPath;
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${API_ORIGIN}/${raw.replace(/^\//, "")}`;
}

export default function TransactionCard({ transaction, onDelete, index = 0 }) {
  const date = new Date(transaction.spentAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
  const receiptUrl = resolveReceiptUrl(transaction);

  return (
    <div
      className="card-hover stagger-in relative flex items-center justify-between gap-4 overflow-hidden rounded-xl border border-line bg-surface px-5 py-4 transition-shadow"
      style={{ "--delay": `${Math.min(index, 8) * 60}ms` }}
    >
      <div className="card-accent-line" aria-hidden />

      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-paper text-xs font-medium text-ink/50">
          {date}
        </div>
        <div>
          <p className="font-medium text-ink">{transaction.description}</p>
          <div className="mt-1 flex items-center gap-2">
            <CategoryBadge category={transaction.category} />
            {transaction.merchant && (
              <span className="text-xs text-ink/40">{transaction.merchant}</span>
            )}
            {transaction.source === "AI_CATEGORIZED" && (
              <span
                className="glow-badge animate-fade-in text-xs text-gold"
                title={`AI confidence: ${Math.round((transaction.aiConfidence || 0) * 100)}%`}
              >
                ✨ AI-tagged
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {receiptUrl && (
          <a
            href={receiptUrl}
            target="_blank"
            rel="noreferrer"
            className="shrink-0"
            aria-label={`View receipt for ${transaction.description}`}
            title="View receipt"
          >
            <img
              src={receiptUrl}
              alt=""
              loading="lazy"
              className="h-9 w-9 rounded-md border border-line object-cover transition-transform hover:scale-105"
            />
          </a>
        )}
        <span className="font-mono text-base font-medium text-ink">
          {currencyFormatter.format(transaction.amount)}
        </span>
        <button
          onClick={() => onDelete(transaction.id)}
          className="text-xs text-ink/30 transition-all hover:text-brick hover:scale-105"
          aria-label={`Delete ${transaction.description}`}
        >
          Remove
        </button>
      </div>
    </div>
  );
}
