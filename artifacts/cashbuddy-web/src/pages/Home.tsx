import { useState } from "react";
import {
  Plus, TrendingUp, TrendingDown, AlertTriangle, Target,
  MessageCircle, BarChart2, Zap, Bell, Calendar
} from "lucide-react";
import { Link } from "wouter";
import { useApp } from "@/context/AppContext";
import { CATEGORY_CONFIG, fmt, fmtDate } from "@/lib/categories";
import type { TransactionCategory } from "@/context/AppContext";
import AddTransactionModal from "@/components/AddTransactionModal";
import { MobileNav } from "@/components/Sidebar";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function HomePage() {
  const { transactions, profile, getBalance, getMonthlyIncome, getMonthlyExpenses, getCategorySpending, budgets, goals } = useApp();
  const [showAdd, setShowAdd] = useState(false);

  const balance = getBalance();
  const income = getMonthlyIncome();
  const expenses = getMonthlyExpenses();
  const savings = income - expenses;
  const savingsRate = income > 0 ? ((savings / income) * 100).toFixed(0) : "0";

  const recent = transactions.slice(0, 8);
  const alertBudgets = budgets.filter((b) => b.spent / b.limit >= 0.8 && b.limit > 0);
  const categorySpending = getCategorySpending();
  const topCategory = Object.entries(categorySpending).sort(([, a], [, b]) => b - a)[0];

  return (
    <div className="p-4 md:p-8 pb-24 md:pb-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[#9AA5B8] text-sm">{getGreeting()},</p>
          <h1 className="text-2xl font-bold text-white mt-1">{profile.name.split(" ")[0]}</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/ai-chat">
            <button className="w-10 h-10 glass rounded-xl flex items-center justify-center text-white hover:bg-white/10 transition-colors">
              <MessageCircle size={18} />
            </button>
          </Link>
          <button className="w-10 h-10 glass rounded-xl flex items-center justify-center text-[#FFD700] hover:bg-white/10 transition-colors">
            <Bell size={18} />
          </button>
        </div>
      </div>

      {/* Level strip */}
      <div className="flex gap-2 mb-6">
        <div className="flex items-center gap-1.5 bg-[#FFD700]/10 border border-[#FFD700]/25 px-3 py-1.5 rounded-full">
          <Zap size={12} className="text-[#FFD700]" />
          <span className="text-xs text-[#FFD700] font-semibold">Level {profile.level} · {profile.xp} XP</span>
        </div>
        <div className="flex items-center gap-1.5 bg-[#00C853]/10 border border-[#00C853]/25 px-3 py-1.5 rounded-full">
          <Calendar size={12} className="text-[#00C853]" />
          <span className="text-xs text-[#00C853] font-semibold">{profile.streak} day streak</span>
        </div>
      </div>

      {/* Balance card */}
      <div className="glass-card p-6 mb-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1565C0]/20 to-transparent pointer-events-none rounded-2xl" />
        <p className="text-[#9AA5B8] text-sm mb-1">Total Balance</p>
        <p className={`text-4xl font-bold mb-4 ${balance >= 0 ? "text-white" : "text-[#FF1744]"}`}>
          {fmt(balance)}
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#00C853]/10 border border-[#00C853]/20 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp size={14} className="text-[#00C853]" />
              <span className="text-xs text-[#9AA5B8]">Monthly Income</span>
            </div>
            <p className="text-[#00C853] font-bold text-lg">{fmt(income)}</p>
          </div>
          <div className="bg-[#FF1744]/10 border border-[#FF1744]/20 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown size={14} className="text-[#FF1744]" />
              <span className="text-xs text-[#9AA5B8]">Monthly Expenses</span>
            </div>
            <p className="text-[#FF1744] font-bold text-lg">{fmt(expenses)}</p>
          </div>
        </div>
      </div>

      {/* Insights */}
      {(income > 0 || expenses > 0) && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Savings Rate", value: `${savingsRate}%`, color: parseFloat(savingsRate) >= 20 ? "#00C853" : "#FF6D00", sub: parseFloat(savingsRate) >= 20 ? "Healthy" : "Improve" },
            { label: "Top Spend", value: topCategory ? CATEGORY_CONFIG[topCategory[0] as TransactionCategory]?.label ?? "—" : "—", color: "#1E88E5", sub: topCategory ? fmt(topCategory[1]) : "No data" },
            { label: "Goals", value: `${goals.length}`, color: "#FFD700", sub: `${goals.filter(g => g.currentAmount >= g.targetAmount).length} done` },
          ].map(({ label, value, color, sub }) => (
            <div key={label} className="glass-card p-3 text-center">
              <p className="text-white font-bold text-sm">{value}</p>
              <p className="text-[#9AA5B8] text-xs mt-0.5">{label}</p>
              <p className="text-xs font-semibold mt-1" style={{ color }}>{sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-5 gap-2 mb-6">
        {[
          { label: "Add", icon: Plus, color: "#00C853", onClick: () => setShowAdd(true) },
          { label: "Analytics", icon: BarChart2, color: "#1E88E5", href: "/analytics" },
          { label: "Goals", icon: Target, color: "#FFD700", href: "/goals" },
          { label: "AI Tips", icon: MessageCircle, color: "#A78BFA", href: "/ai-chat" },
          { label: "Budget", icon: AlertTriangle, color: "#FF6D00", href: "/analytics" },
        ].map(({ label, icon: Icon, color, onClick, href }) => (
          href ? (
            <Link key={label} href={href}>
              <div className="flex flex-col items-center gap-2 cursor-pointer">
                <div className="w-12 h-12 md:w-14 md:h-14 glass rounded-2xl flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10">
                  <Icon size={20} style={{ color }} />
                </div>
                <span className="text-[10px] text-[#9AA5B8] font-medium">{label}</span>
              </div>
            </Link>
          ) : (
            <div key={label} className="flex flex-col items-center gap-2 cursor-pointer" onClick={onClick}>
              <div className="w-12 h-12 md:w-14 md:h-14 glass rounded-2xl flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10">
                <Icon size={20} style={{ color }} />
              </div>
              <span className="text-[10px] text-[#9AA5B8] font-medium">{label}</span>
            </div>
          )
        ))}
      </div>

      {/* Alerts */}
      {alertBudgets.length > 0 && (
        <div className="mb-6">
          <h2 className="text-white font-bold text-base mb-3">Budget Alerts</h2>
          <div className="space-y-2">
            {alertBudgets.slice(0, 2).map((b) => (
              <div key={b.category} className="glass-card p-3 flex items-center gap-3 border border-[#FF1744]/20">
                <div className={`w-2 h-2 rounded-full ${b.spent >= b.limit ? "bg-[#FF1744]" : "bg-[#FF6D00]"}`} />
                <div className="flex-1">
                  <p className="text-[#E8F0FE] text-sm font-medium">
                    {CATEGORY_CONFIG[b.category as TransactionCategory].label} {b.spent >= b.limit ? "exceeded" : "80% used"}
                  </p>
                  <p className="text-[#9AA5B8] text-xs">{fmt(b.spent)} / {fmt(b.limit)}</p>
                </div>
                <AlertTriangle size={16} className={b.spent >= b.limit ? "text-[#FF1744]" : "text-[#FF6D00]"} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent transactions */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-white font-bold text-base">Recent Transactions</h2>
          <Link href="/analytics">
            <span className="text-[#1E88E5] text-sm font-semibold hover:underline cursor-pointer">See All</span>
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <div className="w-14 h-14 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Plus size={24} className="text-white" />
            </div>
            <p className="text-white font-bold mb-2">No transactions yet</p>
            <p className="text-[#9AA5B8] text-sm mb-4">Start tracking your income and expenses</p>
            <button
              onClick={() => setShowAdd(true)}
              className="gradient-primary text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Add First Transaction
            </button>
          </div>
        ) : (
          <div className="glass-card divide-y divide-[#1E2D50] overflow-hidden">
            {recent.map((tx) => {
              const cfg = CATEGORY_CONFIG[tx.category as TransactionCategory];
              return (
                <div key={tx.id} className="flex items-center gap-3 p-4 hover:bg-white/5 transition-colors">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cfg.color + "22" }}>
                    <span className="text-lg">{getCategoryEmoji(tx.category as TransactionCategory)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#E8F0FE] text-sm font-medium truncate">{tx.note || cfg.label}</p>
                    <p className="text-[#9AA5B8] text-xs">{fmtDate(tx.date)} · {cfg.label}</p>
                  </div>
                  <p className={`font-bold text-sm flex-shrink-0 ${tx.type === "income" ? "text-[#00C853]" : "text-[#FF1744]"}`}>
                    {tx.type === "income" ? "+" : "-"}{fmt(tx.amount)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FAB mobile */}
      <button
        onClick={() => setShowAdd(true)}
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 gradient-primary rounded-full shadow-xl shadow-blue-900/50 flex items-center justify-center text-white z-40 border-2 border-[#1E88E5]"
      >
        <Plus size={24} />
      </button>

      {/* Desktop add button */}
      <button
        onClick={() => setShowAdd(true)}
        className="hidden md:flex fixed bottom-8 right-8 items-center gap-2 gradient-primary text-white px-5 py-3 rounded-2xl shadow-xl shadow-blue-900/40 font-semibold hover:opacity-90 transition-opacity z-40"
      >
        <Plus size={18} /> Add Transaction
      </button>

      <MobileNav />
      {showAdd && <AddTransactionModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}

function getCategoryEmoji(cat: TransactionCategory): string {
  const map: Record<TransactionCategory, string> = {
    food: "🍜", transport: "🚗", shopping: "🛍️", health: "💊",
    entertainment: "🎬", education: "📚", bills: "📄",
    salary: "💼", freelance: "💻", investment: "📈", savings: "💰", other: "📦",
  };
  return map[cat] ?? "📦";
}
