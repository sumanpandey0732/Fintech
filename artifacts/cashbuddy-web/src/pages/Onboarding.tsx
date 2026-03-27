import { useState } from "react";
import { Wallet, ArrowRight, User, DollarSign, CheckCircle } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { fmt } from "@/lib/categories";

export default function OnboardingPage() {
  const { completeOnboarding } = useApp();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");

  const steps = [
    {
      icon: Wallet,
      title: "Welcome to CashBuddy Nepal Pro",
      subtitle: "Your personal finance manager built for Nepal. Track income, expenses, goals — and get AI financial advice.",
      action: "Get Started",
    },
    {
      icon: User,
      title: "What's your name?",
      subtitle: "We'll personalise your experience.",
      action: "Continue",
    },
    {
      icon: DollarSign,
      title: "Starting balance",
      subtitle: "Enter your current savings or balance. You can change this later.",
      action: "Launch App",
    },
  ];

  const current = steps[step];
  const Icon = current.icon;

  const canContinue =
    step === 0 ||
    (step === 1 && name.trim().length >= 2) ||
    step === 2;

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      completeOnboarding(name.trim() || "User", parseFloat(balance) || 0);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Step dots */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? "w-8 bg-[#1565C0]" : i < step ? "w-4 bg-[#1565C0]/50" : "w-4 bg-[#1E2D50]"
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="glass-card p-8 text-center">
          <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-900/40">
            <Icon size={36} className="text-white" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-3">{current.title}</h1>
          <p className="text-[#9AA5B8] text-sm leading-relaxed mb-8">{current.subtitle}</p>

          {step === 1 && (
            <input
              className="w-full bg-[#0F1C36] border border-[#1E2D50] rounded-xl px-4 py-3 text-white placeholder-[#9AA5B8] text-base outline-none focus:border-[#1565C0] transition-colors mb-6"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && canContinue && handleNext()}
            />
          )}

          {step === 2 && (
            <div className="relative mb-6">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9AA5B8] font-medium">Rs.</span>
              <input
                className="w-full bg-[#0F1C36] border border-[#1E2D50] rounded-xl px-4 py-3 pl-12 text-white placeholder-[#9AA5B8] text-base outline-none focus:border-[#1565C0] transition-colors"
                placeholder="0"
                value={balance}
                onChange={(e) => setBalance(e.target.value.replace(/[^0-9.]/g, ""))}
                type="text"
                inputMode="decimal"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleNext()}
              />
            </div>
          )}

          <button
            onClick={handleNext}
            disabled={!canContinue}
            className={`w-full py-4 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-all ${
              canContinue
                ? "gradient-primary text-white shadow-lg shadow-blue-900/40 hover:opacity-90 active:scale-95"
                : "bg-[#1E2D50] text-[#9AA5B8] cursor-not-allowed"
            }`}
          >
            {step === steps.length - 1 ? (
              <>
                <CheckCircle size={18} /> {current.action}
              </>
            ) : (
              <>
                {current.action} <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>

        <p className="text-center text-[#9AA5B8] text-xs mt-6">
          Built by Santosh Pandey · All data stored locally
        </p>
      </div>
    </div>
  );
}
