import { useState, useRef } from "react";
import api from "../lib/api";
import { useDebouncer } from "../lib/useClosures";

export default function TransactionForm({ categories, onCreated }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [autoCategrize, setAutoCategrize] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [aiHint, setAiHint] = useState(""); // debounced AI category hint
  const fileInputRef = useRef(null);

  // CLOSURE IN ACTION: useDebouncer returns a closure (a function that
  // remembers its internal `timer` variable). We use it to avoid firing
  // a hint-fetch on every single keystroke — only after the user pauses.
  const debounce = useDebouncer(400);

  function validate() {
    const next = {};
    if (!description.trim() || description.trim().length < 2) {
      next.description = "Description must be at least 2 characters";
    }
    const amountNum = Number(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      next.amount = "Enter an amount greater than 0";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("description", description.trim());
      formData.append("amount", amount);
      formData.append("autoCategrize", categoryId ? "false" : String(autoCategrize));
      if (categoryId) formData.append("categoryId", categoryId);
      if (receipt) formData.append("receipt", receipt);

      // No manual Content-Type — let the browser generate the multipart boundary.
      const res = await api.post("/transactions", formData);

      onCreated(res.data.data);
      setDescription("");
      setAmount("");
      setCategoryId("");
      setReceipt(null);
      if (fileInputRef.current) fileInputRef.current.value = ""; // actually clears the visible filename
    } catch (err) {
      setFormError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="card-hover stagger-in relative space-y-4 overflow-hidden rounded-xl border border-line bg-surface p-5 transition-shadow"
    >
      <div className="card-accent-line" aria-hidden />

      <div>
        <label className="mb-1 block text-xs font-medium text-ink/60">Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => {
            const val = e.target.value;
            setDescription(val);
            // CLOSURE USED HERE: `debounce` is a closure — it remembers its
            // internal timer across keystrokes without us managing it.
            // Every keystroke calls the same closed-over function, which
            // clears the previous timer and sets a new one. After 400ms of
            // silence it shows a category hint based on what was typed.
            debounce(() => {
              if (val.trim().length > 3) {
                const lower = val.toLowerCase();
                const matched = categories.find((c) =>
                  lower.includes(c.name.toLowerCase())
                );
                setAiHint(matched ? `Likely category: ${matched.icon} ${matched.name}` : "");
              } else {
                setAiHint("");
              }
            });
          }}
          placeholder='e.g. "Swiggy order 450 rupees"'
          className="w-full rounded-lg border border-line px-3 py-2 text-sm text-ink focus:border-forest"
        />
        {aiHint && !categoryId && (
          <p className="mt-1 text-xs text-forest-light">{aiHint}</p>
        )}
        {errors.description && (
          <p className="mt-1 text-xs text-brick">{errors.description}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink/60">Amount (₹)</label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-lg border border-line px-3 py-2 font-mono text-sm text-ink focus:border-forest"
          />
          {errors.amount && <p className="mt-1 text-xs text-brick">{errors.amount}</p>}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-ink/60">
            Category (optional)
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-lg border border-line px-3 py-2 text-sm text-ink focus:border-forest"
          >
            <option value="">Let AI decide ✨</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-ink/60">
          Receipt image (optional)
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          onChange={(e) => setReceipt(e.target.files[0] || null)}
          className="w-full text-sm text-ink/70 file:mr-3 file:rounded-md file:border-0 file:bg-forest/15 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-forest-light"
        />
      </div>

      {formError && <p className="text-sm text-brick">{formError}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="btn-primary w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {submitting ? "Adding..." : "Add expense"}
      </button>
    </form>
  );
}