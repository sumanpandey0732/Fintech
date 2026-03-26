import { TransactionCategory } from "@/context/AppContext";
import COLORS from "@/constants/colors";

export interface CategoryConfig {
  label: string;
  icon: string;
  color: string;
  type: "expense" | "income" | "both";
  iconSet: "Feather" | "MaterialCommunityIcons" | "Ionicons";
}

export const CATEGORY_CONFIG: Record<TransactionCategory, CategoryConfig> = {
  food: {
    label: "Food & Drink",
    icon: "coffee",
    color: COLORS.food,
    type: "expense",
    iconSet: "Feather",
  },
  transport: {
    label: "Transport",
    icon: "navigation",
    color: COLORS.transport,
    type: "expense",
    iconSet: "Feather",
  },
  shopping: {
    label: "Shopping",
    icon: "shopping-bag",
    color: COLORS.shopping,
    type: "expense",
    iconSet: "Feather",
  },
  health: {
    label: "Health",
    icon: "heart",
    color: COLORS.health,
    type: "expense",
    iconSet: "Feather",
  },
  entertainment: {
    label: "Fun",
    icon: "film",
    color: COLORS.entertainment,
    type: "expense",
    iconSet: "Feather",
  },
  education: {
    label: "Education",
    icon: "book",
    color: COLORS.education,
    type: "expense",
    iconSet: "Feather",
  },
  bills: {
    label: "Bills",
    icon: "file-text",
    color: COLORS.bills,
    type: "expense",
    iconSet: "Feather",
  },
  salary: {
    label: "Salary",
    icon: "briefcase",
    color: COLORS.salary,
    type: "income",
    iconSet: "Feather",
  },
  freelance: {
    label: "Freelance",
    icon: "monitor",
    color: COLORS.freelance,
    type: "income",
    iconSet: "Feather",
  },
  investment: {
    label: "Investment",
    icon: "trending-up",
    color: COLORS.investment,
    type: "income",
    iconSet: "Feather",
  },
  savings: {
    label: "Savings",
    icon: "dollar-sign",
    color: "#2196F3",
    type: "both",
    iconSet: "Feather",
  },
  other: {
    label: "Other",
    icon: "more-horizontal",
    color: COLORS.other,
    type: "both",
    iconSet: "Feather",
  },
};

export const EXPENSE_CATEGORIES: TransactionCategory[] = [
  "food",
  "transport",
  "shopping",
  "health",
  "entertainment",
  "education",
  "bills",
  "other",
];

export const INCOME_CATEGORIES: TransactionCategory[] = [
  "salary",
  "freelance",
  "investment",
  "savings",
  "other",
];

export function formatAmount(amount: number, currency: string = "Rs."): string {
  return `${currency} ${amount.toLocaleString("en-IN")}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const txDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (txDate.getTime() === today.getTime()) return "Today";
  if (txDate.getTime() === yesterday.getTime()) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}
