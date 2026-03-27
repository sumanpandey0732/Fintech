import { useRef, useState } from "react";
import { Send, Cpu, Trash2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useApp } from "@/context/AppContext";
import { fmt } from "@/lib/categories";
import type { ChatMessage } from "@/context/AppContext";
import { MobileNav } from "@/components/Sidebar";

const API_KEY = import.meta.env.VITE_API_KEY ?? "";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "mistralai/mistral-7b-instruct:free";

async function callOpenRouter(messages: { role: string; content: string }[]): Promise<string> {
  if (!API_KEY) return "⚠️ API key not configured. Add VITE_API_KEY to your environment variables to enable real AI responses.";
  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://cashbuddy-nepal.app",
        "X-Title": "CashBuddy Nepal Pro",
      },
      body: JSON.stringify({ model: MODEL, messages, max_tokens: 400, temperature: 0.7 }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() ?? "Sorry, no response. Try again.";
  } catch {
    return "Connection error. Check your internet and try again.";
  }
}

function buildSystem(balance: number, income: number, expenses: number, name: string): string {
  const rate = income > 0 ? ((income - expenses) / income * 100).toFixed(0) : "0";
  return `You are CashBuddy AI, a personal financial advisor for Nepal. You are helping ${name}.
Financial Data: Balance ${fmt(balance)}, Monthly Income ${fmt(income)}, Monthly Expenses ${fmt(expenses)}, Savings Rate ${rate}%.
Guidelines: Keep responses concise (3-5 sentences). Reference Nepal-specific options (NEPSE, NIC Asia, Everest Bank, FD rates ~8-9%). Use Rs./NPR for amounts. Be encouraging and actionable.`;
}

const SUGGESTIONS = [
  "How's my financial health?",
  "Tips to save more this month",
  "Should I invest in NEPSE?",
  "How to build an emergency fund?",
  "Best banks in Nepal for savings?",
];

export default function AIChatPage() {
  const { chatHistory, addChatMessage, clearChatHistory, getBalance, getMonthlyIncome, getMonthlyExpenses, profile } = useApp();
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleSend = async (msg?: string) => {
    const text = (msg ?? input).trim();
    if (!text || typing) return;
    setInput("");

    addChatMessage({ role: "user", content: text, timestamp: new Date().toISOString() });
    setTyping(true);

    const system = buildSystem(getBalance(), getMonthlyIncome(), getMonthlyExpenses(), profile.name);
    const history = chatHistory.slice(-8).map((m) => ({ role: m.role, content: m.content }));

    const response = await callOpenRouter([
      { role: "system", content: system },
      ...history,
      { role: "user", content: text },
    ]);

    addChatMessage({ role: "assistant", content: response, timestamp: new Date().toISOString() });
    setTyping(false);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 md:p-5 border-b border-[#1E2D50] bg-[#060D1F]/80 backdrop-blur-xl flex-shrink-0">
        <Link href="/" className="md:hidden">
          <button className="w-9 h-9 glass rounded-xl flex items-center justify-center text-[#9AA5B8] hover:text-white">
            <ArrowLeft size={18} />
          </button>
        </Link>
        <div className="w-10 h-10 rounded-xl bg-[#1565C0]/20 border border-[#1565C0]/40 flex items-center justify-center relative">
          <Cpu size={18} className="text-[#1E88E5]" />
          <div className="absolute bottom-1 right-1 w-2 h-2 bg-[#00C853] rounded-full border border-[#060D1F]" />
        </div>
        <div className="flex-1">
          <p className="text-white font-bold text-sm">AI Financial Advisor</p>
          <p className="text-[#00C853] text-xs">{API_KEY ? "Powered by OpenRouter · Mistral 7B" : "Configure API Key to enable"}</p>
        </div>
        <button onClick={clearChatHistory} className="text-[#9AA5B8] hover:text-[#FF1744] transition-colors">
          <Trash2 size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 pb-20 md:pb-4">
        {chatHistory.length === 0 && (
          <div className="flex flex-col items-center py-10 gap-4 text-center">
            <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center shadow-xl">
              <Cpu size={28} className="text-white" />
            </div>
            <p className="text-white font-bold text-lg">CashBuddy AI</p>
            <p className="text-[#9AA5B8] text-sm max-w-sm leading-relaxed">
              Hi {profile.name.split(" ")[0]}! I'm your AI financial advisor for Nepal. Ask me anything about managing your money.
            </p>
            {API_KEY && (
              <div className="flex items-center gap-2 bg-[#FFD700]/10 border border-[#FFD700]/25 px-3 py-1.5 rounded-full">
                <span className="text-xs text-[#FFD700] font-semibold">⚡ Powered by OpenRouter · Mistral 7B</span>
              </div>
            )}
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="bg-[#1565C0]/15 border border-[#1565C0]/30 text-[#1E88E5] text-sm px-4 py-2 rounded-xl hover:bg-[#1565C0]/25 transition-colors font-medium"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {chatHistory.map((msg: ChatMessage) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-xl bg-[#1565C0]/20 border border-[#1565C0]/40 flex items-center justify-center flex-shrink-0 mt-1">
                <Cpu size={14} className="text-[#1E88E5]" />
              </div>
            )}
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-[#1565C0] text-white rounded-br-sm"
                  : "glass-card text-[#E8F0FE] rounded-bl-sm"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {typing && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#1565C0]/20 border border-[#1565C0]/40 flex items-center justify-center flex-shrink-0">
              <Cpu size={14} className="text-[#1E88E5]" />
            </div>
            <div className="glass-card px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1.5 items-center">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-2 h-2 bg-[#1E88E5] rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions when chat is open */}
      {chatHistory.length > 0 && (
        <div className="flex gap-2 px-4 py-2 overflow-x-auto flex-shrink-0">
          {SUGGESTIONS.slice(0, 3).map((s) => (
            <button
              key={s}
              onClick={() => handleSend(s)}
              className="flex-shrink-0 bg-[#1565C0]/15 border border-[#1565C0]/30 text-[#1E88E5] text-xs px-3 py-2 rounded-xl hover:bg-[#1565C0]/25 transition-colors font-medium"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-[#1E2D50] bg-[#060D1F]/80 backdrop-blur-xl flex-shrink-0 pb-20 md:pb-4">
        <div className="flex gap-3 items-end">
          <textarea
            className="flex-1 bg-[#0F1C36] border border-[#1E2D50] rounded-2xl px-4 py-3 text-white placeholder-[#9AA5B8] text-sm outline-none focus:border-[#1565C0] transition-colors resize-none max-h-32"
            placeholder="Ask anything about your finances..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={1}
            disabled={typing}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || typing}
            className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
              input.trim() && !typing ? "gradient-primary text-white hover:opacity-90 shadow-lg shadow-blue-900/40" : "bg-[#1E2D50] text-[#9AA5B8] cursor-not-allowed"
            }`}
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      <MobileNav />
    </div>
  );
}
