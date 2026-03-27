import { Link, useLocation } from "wouter";
import {
  Home, BarChart2, Target, MessageCircle, User, Zap, Wallet
} from "lucide-react";
import { useApp } from "@/context/AppContext";

const nav = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/analytics", icon: BarChart2, label: "Analytics" },
  { href: "/goals", icon: Target, label: "Goals" },
  { href: "/ai-chat", icon: MessageCircle, label: "AI Advisor" },
  { href: "/profile", icon: User, label: "Profile" },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { profile } = useApp();

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-[#1E2D50] bg-[#060D1F]/90 backdrop-blur-xl">
      {/* Logo */}
      <div className="p-6 border-b border-[#1E2D50]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
            <Wallet size={20} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-base leading-tight">CashBuddy</p>
            <p className="text-[#9AA5B8] text-xs">Nepal Pro</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {nav.map(({ href, icon: Icon, label }) => {
          const active = location === href;
          return (
            <Link key={href} href={href}>
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 ${
                  active
                    ? "bg-[#1565C0] text-white shadow-lg shadow-blue-900/30"
                    : "text-[#9AA5B8] hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon size={18} />
                <span className="text-sm font-medium">{label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Level badge */}
      <div className="p-4 border-t border-[#1E2D50]">
        <div className="glass-card p-3">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={14} className="text-[#FFD700]" />
            <span className="text-xs text-[#FFD700] font-semibold">Level {profile.level}</span>
            <span className="text-xs text-[#9AA5B8] ml-auto">{profile.xp} XP</span>
          </div>
          <div className="w-full bg-[#1E2D50] rounded-full h-1.5">
            <div
              className="bg-gradient-to-r from-[#1565C0] to-[#42A5F5] h-1.5 rounded-full transition-all"
              style={{ width: `${(profile.xp % 100)}%` }}
            />
          </div>
          <p className="text-xs text-[#9AA5B8] mt-1">{profile.name}</p>
        </div>
      </div>
    </aside>
  );
}

/* Mobile bottom nav */
export function MobileNav() {
  const [location] = useLocation();
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#060D1F]/95 backdrop-blur-xl border-t border-[#1E2D50] flex z-50">
      {nav.map(({ href, icon: Icon, label }) => {
        const active = location === href;
        return (
          <Link key={href} href={href} className="flex-1">
            <div className={`flex flex-col items-center py-3 gap-1 ${active ? "text-[#1E88E5]" : "text-[#9AA5B8]"}`}>
              <Icon size={20} />
              <span className="text-[10px] font-medium">{label}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
