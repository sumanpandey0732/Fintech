import { useState } from "react";
import { X, Plus } from "lucide-react";
import { useApp } from "@/context/AppContext";
import type { TransactionCategory } from "@/context/AppContext";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, CATEGORY_CONFIG } from "@/lib/categories";

interface Props { onClose: () => void; }

const EMOJI_MAP: Record<TransactionCategory, string> = {
  food: "🍜", transport: "🚗", shopping: "🛍️", health: "💊",
  entertainment: "🎬", education: "📚", bills: "📄",
  salary: "💼", freelance: "💻", investment: "📈", savings: "💰", other: "📦",
};

export default function AddTransactionModal({ onClose }: Props) {
  const { addTransaction } = useApp();
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<TransactionCategory>("food");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleSubmit = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    addTransaction({ type, amount: amt, category, note, date });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full md:max-w-md glass-card md:rounded-2xl rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-white font-bold text-lg">Add Transaction</h2>
          <button onClick={onClose} className="w-8 h-8 glass rounded-lg flex items-center justify-center text-[#9AA5B8] hover:text-white">
            <X size={16} />
          </button>
        </div>

        <div className="flex p-1 bg-[#0F1C36] rounded-xl mb-5 border border-[#1E2D50]">
          {(["expense", "income"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setType(t); setCategory(t === "income" ? "salary" : "food"); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold capitalize transition-all ${
                type === t
                  ? t === "income" ? "bg-[#00C853] text-white shadow" : "bg-[#FF1744] text-white shadow"
                  : "text-[#9AA5B8]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="relative mb-5">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9AA5B8] font-medium text-sm">Rs.</span>
          <input
            className="w-full bg-[#0F1C36] border border-[#1E2D50] rounded-xl px-4 py-3 pl-12 text-white text-xl font-bold placeholder-[#9AA5B8] outline-none focus:border-[#1565C0] transition-colors"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            type="text"
            inputMode="decimal"
            autoFocus
          />
        </div>

        <p className="text-[#9AA5B8] text-xs font-semibold uppercase tracking-wider mb-2">Category</p>
        <div className="grid grid-cols-4 gap-2 mb-5">
          {categories.map((cat) => {
            const cfg = CATEGORY_CONFIG[cat];
            const active = category === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all ${
                  active ? "border-[#1565C0] bg-[#1565C0]/20" : "border-[#1E2D50] bg-[#0F1C36] hover:border-[#1565C0]/50"
                }`}
              >
                <span className="text-lg">{EMOJI_MAP[cat]}</span>
                <span className="text-[10px] text-[#9AA5B8] text-center leading-tight">{cfg.label}</span>
              </button>
            );
          })}
        </div>

        <input
          className="w-full bg-[#0F1C36] border border-[#1E2D50] rounded-xl px-4 py-3 text-white placeholder-[#9AA5B8] text-sm outline-none focus:border-[#1565C0] transition-colors mb-4"
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <input
          className="w-full bg-[#0F1C36] border border-[#1E2D50] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#1565C0] transition-colors mb-6"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <button
          onClick={handleSubmit}
          disabled={!amount || parseFloat(amount) <= 0}
          className={`w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
            amount && parseFloat(amount) > 0
              ? "gradient-primary text-white hover:opacity-90 shadow-lg shadow-blue-900/40"
              : "bg-[#1E2D50] text-[#9AA5B8] cursor-not-allowed"
          }`}
        >
          <Plus size={18} /> Add Transaction
        </button>
      </div>
    </div>
  );
}
