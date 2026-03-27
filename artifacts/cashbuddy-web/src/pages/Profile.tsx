import { useState } from "react";
import { User, Zap, Calendar, Award, Edit3, Save, Trash2, Shield, Info } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { fmt } from "@/lib/categories";
import { MobileNav } from "@/components/Sidebar";

export default function ProfilePage() {
  const { profile, updateProfile, transactions, goals } = useApp();
  const [editName, setEditName] = useState(false);
  const [name, setName] = useState(profile.name);
  const [editBalance, setEditBalance] = useState(false);
  const [balance, setBalance] = useState(profile.startingBalance.toString());

  const completedGoals = goals.filter((g) => g.currentAmount >= g.targetAmount).length;
  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);

  return (
    <div className="p-4 md:p-8 pb-24 md:pb-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Profile</h1>

      {/* Avatar card */}
      <div className="glass-card p-6 mb-5 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1565C0]/15 to-transparent pointer-events-none rounded-2xl" />
        <div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center mx-auto mb-3 shadow-xl shadow-blue-900/40">
          <User size={36} className="text-white" />
        </div>

        {editName ? (
          <div className="flex items-center gap-2 justify-center mb-2">
            <input
              className="bg-[#0F1C36] border border-[#1565C0] rounded-xl px-4 py-2 text-white text-lg font-bold text-center outline-none w-48"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            <button onClick={() => { updateProfile({ name: name.trim() || profile.name }); setEditName(false); }} className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center text-white">
              <Save size={14} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 mb-1">
            <h2 className="text-white font-bold text-xl">{profile.name}</h2>
            <button onClick={() => setEditName(true)} className="text-[#9AA5B8] hover:text-white"><Edit3 size={15} /></button>
          </div>
        )}

        <div className="flex justify-center gap-3 mt-3">
          <div className="flex items-center gap-1.5 bg-[#FFD700]/10 border border-[#FFD700]/25 px-3 py-1.5 rounded-full">
            <Zap size={12} className="text-[#FFD700]" />
            <span className="text-xs text-[#FFD700] font-semibold">Level {profile.level} · {profile.xp} XP</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#00C853]/10 border border-[#00C853]/25 px-3 py-1.5 rounded-full">
            <Calendar size={12} className="text-[#00C853]" />
            <span className="text-xs text-[#00C853] font-semibold">{profile.streak} day streak</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Transactions", value: transactions.length, color: "#1E88E5" },
          { label: "Goals Done", value: completedGoals, color: "#00C853" },
          { label: "Total Saved", value: fmt(totalSaved), color: "#FFD700", small: true },
        ].map(({ label, value, color, small }) => (
          <div key={label} className="glass-card p-3 text-center">
            <p className={`font-bold ${small ? "text-sm" : "text-xl"} mb-0.5`} style={{ color }}>{value}</p>
            <p className="text-[#9AA5B8] text-xs">{label}</p>
          </div>
        ))}
      </div>

      {/* XP Progress */}
      <div className="glass-card p-4 mb-5">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-[#FFD700]" />
            <span className="text-white font-semibold text-sm">Level Progress</span>
          </div>
          <span className="text-[#9AA5B8] text-xs">{profile.xp % 100}/100 XP to next level</span>
        </div>
        <div className="w-full bg-[#1E2D50] rounded-full h-2.5">
          <div
            className="h-2.5 rounded-full bg-gradient-to-r from-[#1565C0] to-[#42A5F5] transition-all"
            style={{ width: `${profile.xp % 100}%` }}
          />
        </div>
        <p className="text-[#9AA5B8] text-xs mt-2">+10 XP per expense · +15 XP per income added</p>
      </div>

      {/* Settings */}
      <div className="glass-card mb-5">
        <div className="p-4 border-b border-[#1E2D50]">
          <p className="text-[#9AA5B8] text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2"><Shield size={12} /> Account Settings</p>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-[#E8F0FE] text-sm font-medium">Starting Balance</p>
              <p className="text-[#9AA5B8] text-xs">Base balance before transactions</p>
            </div>
            {editBalance ? (
              <div className="flex items-center gap-2">
                <input
                  className="bg-[#0F1C36] border border-[#1565C0] rounded-lg px-3 py-1.5 text-white text-sm outline-none w-28 text-right"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value.replace(/[^0-9.]/g, ""))}
                  autoFocus
                />
                <button
                  onClick={() => { updateProfile({ startingBalance: parseFloat(balance) || 0 }); setEditBalance(false); }}
                  className="gradient-primary text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
                >Save</button>
                <button onClick={() => setEditBalance(false)} className="text-[#9AA5B8] text-sm">✕</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[#1E88E5] text-sm font-semibold">{fmt(profile.startingBalance)}</span>
                <button onClick={() => setEditBalance(true)} className="text-[#9AA5B8] hover:text-white"><Edit3 size={14} /></button>
              </div>
            )}
          </div>
        </div>

        <div className="p-4">
          <button
            onClick={() => {
              if (confirm("Clear all data? This cannot be undone.")) {
                localStorage.clear();
                window.location.reload();
              }
            }}
            className="flex items-center gap-2 text-[#FF1744] text-sm font-medium hover:opacity-80 transition-opacity"
          >
            <Trash2 size={15} /> Reset All Data
          </button>
        </div>
      </div>

      {/* About */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Info size={14} className="text-[#9AA5B8]" />
          <p className="text-[#9AA5B8] text-xs font-semibold uppercase tracking-wider">About</p>
        </div>
        <p className="text-[#E8F0FE] text-sm font-bold mb-0.5">CashBuddy Nepal Pro</p>
        <p className="text-[#9AA5B8] text-xs mb-3">Version 1.0.0 · Personal Finance for Nepal</p>
        <p className="text-[#9AA5B8] text-xs">Built by <span className="text-[#1E88E5] font-semibold">Santosh Pandey</span></p>
        <p className="text-[#9AA5B8] text-xs mt-1">All data stored locally in your browser. AI powered by OpenRouter.</p>
      </div>

      <MobileNav />
    </div>
  );
}
