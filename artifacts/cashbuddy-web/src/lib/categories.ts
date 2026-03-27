import type { TransactionCategory } from "@/context/AppContext";

export interface CategoryConfig {
  label: string;
  icon: string;
  color: string;
  type: "expense" | "income" | "both";
}

export const CATEGORY_CONFIG: Record<TransactionCategory, CategoryConfig> = {
  food:          { label: "Food & Drink",   icon: "Coffee",       color: "#FF6B6B", type: "expense" },
  transport:     { label: "Transport",      icon: "Navigation",   color: "#4ECDC4", type: "expense" },
  shopping:      { label: "Shopping",       icon: "ShoppingBag",  color: "#A78BFA", type: "expense" },
  health:        { label: "Health",         icon: "Heart",        color: "#06D6A0", type: "expense" },
  entertainment: { label: "Fun",            icon: "Film",         color: "#FFD166", type: "expense" },
  education:     { label: "Education",      icon: "Book",         color: "#118AB2", type: "expense" },
  bills:         { label: "Bills",          icon: "FileText",     color: "#EF476F", type: "expense" },
  salary:        { label: "Salary",         icon: "Briefcase",    color: "#00C853", type: "income" },
  freelance:     { label: "Freelance",      icon: "Monitor",      color: "#FFB300", type: "income" },
  investment:    { label: "Investment",     icon: "TrendingUp",   color: "#1565C0", type: "income" },
  savings:       { label: "Savings",        icon: "DollarSign",   color: "#2196F3", type: "both" },
  other:         { label: "Other",          icon: "MoreHorizontal", color: "#94A3B8", type: "both" },
};

export const EXPENSE_CATEGORIES: TransactionCategory[] = [
  "food","transport","shopping","health","entertainment","education","bills","other",
];

export const INCOME_CATEGORIES: TransactionCategory[] = [
  "salary","freelance","investment","savings","other",
];

export function fmt(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-IN")}`;
}

export function fmtDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const txDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (txDate.getTime() === today.getTime()) return "Today";
  if (txDate.getTime() === yesterday.getTime()) return "Yesterday";
  return date.toLocaleDateString("en-US", { day: "numeric", month: "short" });
}
