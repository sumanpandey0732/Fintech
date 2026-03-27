import { useMemo, useState } from "react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useApp } from "@/context/AppContext";
import { CATEGORY_CONFIG, fmt } from "@/lib/categories";
import type { TransactionCategory } from "@/context/AppContext";
import AddTransactionModal from "@/components/AddTransactionModal";
import { MobileNav } from "@/components/Sidebar";
import { Plus, Trash2 } from "lucide-react";

export default function AnalyticsPage() {
  const { transactions, budgets, upsertBudget, deleteTransaction } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [tab, setTab] = useState<"overview" | "transactions" | "budgets">("overview");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const monthly = transactions.filter((t) => t.date >= monthStart);
  const income = monthly.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expenses = monthly.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const pieData = useMemo(() => {
    const map: Record<string, number> = {};
    monthly.filter((t) => t.type === "expense").forEach((t) => {
      map[t.category] = (map[t.category] ?? 0) + t.amount;
    });
    return Object.entries(map)
      .map(([cat, value]) => ({
        name: CATEGORY_CONFIG[cat as TransactionCategory]?.label ?? cat,
        value,
        color: CATEGORY_CONFIG[cat as TransactionCategory]?.color ?? "#94A3B8",
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [monthly]);

  const barData = useMemo(() => {
    const months: Record<string, { income: number; expense: number }> = {};
    transactions.forEach((t) => {
      const key = new Date(t.date).toLocaleDateString("en-US", { month: "short" });
      if (!months[key]) months[key] = { income: 0, expense: 0 };
      if (t.type === "income") months[key].income += t.amount;
      else months[key].expense += t.amount;
    });
    return Object.entries(months).slice(-6).map(([month, v]) => ({ month, ...v }));
  }, [transactions]);

  return (
    <div className="p-4 md:p-8 pb-24 md:pb-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="hidden md:flex items-center gap-2 gradient-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Add
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-[#0F1C36] rounded-xl mb-6 border border-[#1E2D50]">
        {(["overview", "transactions", "budgets"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
              tab === t ? "bg-[#1565C0] text-white" : "text-[#9AA5B8] hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card p-4">
              <p className="text-[#9AA5B8] text-xs mb-1">This Month Income</p>
              <p className="text-[#00C853] font-bold text-lg">{fmt(income)}</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-[#9AA5B8] text-xs mb-1">This Month Expenses</p>
              <p className="text-[#FF1744] font-bold text-lg">{fmt(expenses)}</p>
            </div>
          </div>

          {/* Pie chart */}
          {pieData.length > 0 ? (
            <div className="glass-card p-5">
              <h3 className="text-white font-semibold mb-4">Spending by Category</h3>
              <div className="flex flex-col md:flex-row items-center gap-6">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: "#0F1C36", border: "1px solid #1E2D50", borderRadius: "12px", color: "#E8F0FE" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2 min-w-[160px]">
                  {pieData.map((d) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: d.color }} />
                      <span className="text-[#9AA5B8] text-xs flex-1 truncate">{d.name}</span>
                      <span className="text-white text-xs font-semibold">{fmt(d.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card p-8 text-center">
              <p className="text-[#9AA5B8]">No expense data for this month yet.</p>
            </div>
          )}

          {/* Bar chart */}
          {barData.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="text-white font-semibold mb-4">Income vs Expenses</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} barCategoryGap="30%">
                  <XAxis dataKey="month" stroke="#9AA5B8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#9AA5B8" tick={{ fontSize: 11 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                  <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: "#0F1C36", border: "1px solid #1E2D50", borderRadius: "12px", color: "#E8F0FE" }} />
                  <Legend wrapperStyle={{ color: "#9AA5B8", fontSize: "12px" }} />
                  <Bar dataKey="income" name="Income" fill="#00C853" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Expenses" fill="#FF1744" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {tab === "transactions" && (
        <div className="space-y-2">
          {transactions.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <p className="text-[#9AA5B8] mb-4">No transactions yet.</p>
              <button onClick={() => setShowAdd(true)} className="gradient-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold">Add First</button>
            </div>
          ) : (
            transactions.map((tx) => {
              const cfg = CATEGORY_CONFIG[tx.category as TransactionCategory];
              return (
                <div key={tx.id} className="glass-card flex items-center gap-3 p-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: cfg.color + "22" }}>
                    {getEmoji(tx.category as TransactionCategory)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#E8F0FE] text-sm font-medium truncate">{tx.note || cfg.label}</p>
                    <p className="text-[#9AA5B8] text-xs">{new Date(tx.date).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })} · {cfg.label}</p>
                  </div>
                  <p className={`font-bold text-sm flex-shrink-0 ${tx.type === "income" ? "text-[#00C853]" : "text-[#FF1744]"}`}>
                    {tx.type === "income" ? "+" : "-"}{fmt(tx.amount)}
                  </p>
                  <button onClick={() => deleteTransaction(tx.id)} className="ml-2 text-[#9AA5B8] hover:text-[#FF1744] transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === "budgets" && (
        <BudgetsTab budgets={budgets} upsertBudget={upsertBudget} />
      )}

      <button
        onClick={() => setShowAdd(true)}
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 gradient-primary rounded-full shadow-xl flex items-center justify-center text-white z-40"
      >
        <Plus size={24} />
      </button>

      <MobileNav />
      {showAdd && <AddTransactionModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}

function BudgetsTab({ budgets, upsertBudget }: { budgets: any[]; upsertBudget: any }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [limitVal, setLimitVal] = useState("");

  const expenseCategories = ["food", "transport", "shopping", "health", "entertainment", "education", "bills", "other"] as TransactionCategory[];

  return (
    <div className="space-y-3">
      {expenseCategories.map((cat) => {
        const cfg = CATEGORY_CONFIG[cat];
        const budget = budgets.find((b) => b.category === cat);
        const pct = budget ? Math.min((budget.spent / budget.limit) * 100, 100) : 0;
        const isOver = budget && budget.spent >= budget.limit;

        return (
          <div key={cat} className="glass-card p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0" style={{ background: cfg.color + "22" }}>
                {getEmoji(cat)}
              </div>
              <div className="flex-1">
                <p className="text-[#E8F0FE] text-sm font-medium">{cfg.label}</p>
                {budget ? (
                  <p className="text-[#9AA5B8] text-xs">{fmt(budget.spent)} / {fmt(budget.limit)}</p>
                ) : (
                  <p className="text-[#9AA5B8] text-xs">No limit set</p>
                )}
              </div>
              <button
                onClick={() => { setEditing(cat); setLimitVal(budget?.limit?.toString() ?? ""); }}
                className="text-xs text-[#1E88E5] hover:underline font-medium"
              >
                {budget ? "Edit" : "Set Limit"}
              </button>
            </div>
            {budget && (
              <div className="w-full bg-[#1E2D50] rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{ width: `${pct}%`, background: isOver ? "#FF1744" : pct >= 80 ? "#FF6D00" : cfg.color }}
                />
              </div>
            )}
            {editing === cat && (
              <div className="mt-3 flex gap-2">
                <input
                  className="flex-1 bg-[#0F1C36] border border-[#1565C0] rounded-lg px-3 py-2 text-white text-sm outline-none"
                  placeholder="Monthly limit (Rs.)"
                  value={limitVal}
                  onChange={(e) => setLimitVal(e.target.value.replace(/[^0-9]/g, ""))}
                  autoFocus
                />
                <button
                  className="gradient-primary text-white px-4 py-2 rounded-lg text-sm font-semibold"
                  onClick={() => {
                    if (limitVal) upsertBudget({ category: cat, limit: parseInt(limitVal), period: "monthly" });
                    setEditing(null);
                  }}
                >Save</button>
                <button className="text-[#9AA5B8] px-2" onClick={() => setEditing(null)}>✕</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function getEmoji(cat: TransactionCategory): string {
  const map: Record<TransactionCategory, string> = {
    food: "🍜", transport: "🚗", shopping: "🛍️", health: "💊",
    entertainment: "🎬", education: "📚", bills: "📄",
    salary: "💼", freelance: "💻", investment: "📈", savings: "💰", other: "📦",
  };
  return map[cat] ?? "📦";
}
