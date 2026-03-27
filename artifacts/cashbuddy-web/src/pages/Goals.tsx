import { useState } from "react";
import { Plus, Trash2, Target, Award } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { fmt } from "@/lib/categories";
import { MobileNav } from "@/components/Sidebar";

const GOAL_ICONS = ["🏠", "🚗", "✈️", "💻", "🎓", "💍", "🏖️", "💰", "📱", "🎮"];
const GOAL_COLORS = ["#1565C0", "#00C853", "#FFD700", "#A78BFA", "#FF6B6B", "#4ECDC4", "#FF6D00", "#06D6A0", "#118AB2", "#EF476F"];

export default function GoalsPage() {
  const { goals, addGoal, updateGoalAmount, deleteGoal } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [updateAmt, setUpdateAmt] = useState("");

  // Add form state
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [icon, setIcon] = useState("🏠");
  const [color, setColor] = useState(GOAL_COLORS[0]);

  const handleAdd = () => {
    if (!title.trim() || !target) return;
    addGoal({ title: title.trim(), targetAmount: parseFloat(target), currentAmount: 0, deadline, icon, color });
    setShowAdd(false);
    setTitle(""); setTarget(""); setDeadline("");
  };

  return (
    <div className="p-4 md:p-8 pb-24 md:pb-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Saving Goals</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 gradient-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> New Goal
        </button>
      </div>

      {goals.length === 0 && !showAdd ? (
        <div className="glass-card p-10 text-center">
          <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Target size={28} className="text-white" />
          </div>
          <p className="text-white font-bold text-lg mb-2">No goals yet</p>
          <p className="text-[#9AA5B8] text-sm mb-6">Set saving goals to track your financial milestones</p>
          <button onClick={() => setShowAdd(true)} className="gradient-primary text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90">
            Create First Goal
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {goals.map((g) => {
            const pct = Math.min((g.currentAmount / g.targetAmount) * 100, 100);
            const done = g.currentAmount >= g.targetAmount;
            return (
              <div key={g.id} className="glass-card p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: g.color + "22" }}>
                    {g.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-bold truncate">{g.title}</p>
                      {done && <Award size={14} className="text-[#FFD700] flex-shrink-0" />}
                    </div>
                    <p className="text-[#9AA5B8] text-xs mt-0.5">
                      {fmt(g.currentAmount)} / {fmt(g.targetAmount)}
                    </p>
                    {g.deadline && (
                      <p className="text-[#9AA5B8] text-xs mt-0.5">
                        Deadline: {new Date(g.deadline).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    )}
                  </div>
                  <button onClick={() => deleteGoal(g.id)} className="text-[#9AA5B8] hover:text-[#FF1744] transition-colors ml-1">
                    <Trash2 size={15} />
                  </button>
                </div>

                {/* Progress */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#9AA5B8]">{pct.toFixed(0)}%</span>
                    <span style={{ color: g.color }}>{done ? "Completed! 🎉" : `${fmt(g.targetAmount - g.currentAmount)} to go`}</span>
                  </div>
                  <div className="w-full bg-[#1E2D50] rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: done ? "#00C853" : g.color }}
                    />
                  </div>
                </div>

                {/* Update amount */}
                {!done && (
                  updating === g.id ? (
                    <div className="flex gap-2">
                      <input
                        className="flex-1 bg-[#0F1C36] border border-[#1565C0] rounded-lg px-3 py-2 text-white text-sm outline-none"
                        placeholder="Add amount (Rs.)"
                        value={updateAmt}
                        onChange={(e) => setUpdateAmt(e.target.value.replace(/[^0-9]/g, ""))}
                        autoFocus
                      />
                      <button
                        className="gradient-primary text-white px-3 py-2 rounded-lg text-sm font-semibold"
                        onClick={() => {
                          if (updateAmt) updateGoalAmount(g.id, g.currentAmount + parseInt(updateAmt));
                          setUpdating(null); setUpdateAmt("");
                        }}
                      >Add</button>
                      <button className="text-[#9AA5B8] px-2 text-sm" onClick={() => setUpdating(null)}>✕</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setUpdating(g.id)}
                      className="w-full py-2 border border-[#1E2D50] rounded-lg text-[#1E88E5] text-sm font-medium hover:bg-[#1565C0]/10 transition-colors"
                    >
                      Add Progress
                    </button>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
          <div className="w-full md:max-w-md glass-card md:rounded-2xl rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-white font-bold text-lg mb-5">New Saving Goal</h2>

            <input
              className="w-full bg-[#0F1C36] border border-[#1E2D50] rounded-xl px-4 py-3 text-white placeholder-[#9AA5B8] text-sm outline-none focus:border-[#1565C0] mb-4"
              placeholder="Goal title (e.g. New Phone)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />

            <div className="relative mb-4">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9AA5B8] text-sm">Rs.</span>
              <input
                className="w-full bg-[#0F1C36] border border-[#1E2D50] rounded-xl px-4 py-3 pl-12 text-white placeholder-[#9AA5B8] text-sm outline-none focus:border-[#1565C0]"
                placeholder="Target amount"
                value={target}
                onChange={(e) => setTarget(e.target.value.replace(/[^0-9]/g, ""))}
                type="text" inputMode="numeric"
              />
            </div>

            <input
              className="w-full bg-[#0F1C36] border border-[#1E2D50] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#1565C0] mb-4"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />

            <p className="text-[#9AA5B8] text-xs font-semibold uppercase tracking-wider mb-2">Icon</p>
            <div className="flex gap-2 flex-wrap mb-4">
              {GOAL_ICONS.map((ic) => (
                <button key={ic} onClick={() => setIcon(ic)} className={`w-10 h-10 rounded-xl text-xl border transition-all ${icon === ic ? "border-[#1565C0] bg-[#1565C0]/20" : "border-[#1E2D50] bg-[#0F1C36]"}`}>
                  {ic}
                </button>
              ))}
            </div>

            <p className="text-[#9AA5B8] text-xs font-semibold uppercase tracking-wider mb-2">Color</p>
            <div className="flex gap-2 flex-wrap mb-6">
              {GOAL_COLORS.map((c) => (
                <button key={c} onClick={() => setColor(c)} className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? "border-white scale-110" : "border-transparent"}`} style={{ background: c }} />
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-3 border border-[#1E2D50] rounded-xl text-[#9AA5B8] text-sm font-medium hover:bg-white/5">Cancel</button>
              <button
                onClick={handleAdd}
                disabled={!title.trim() || !target}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${title.trim() && target ? "gradient-primary text-white hover:opacity-90" : "bg-[#1E2D50] text-[#9AA5B8] cursor-not-allowed"}`}
              >
                Create Goal
              </button>
            </div>
          </div>
        </div>
      )}

      <MobileNav />
    </div>
  );
}
