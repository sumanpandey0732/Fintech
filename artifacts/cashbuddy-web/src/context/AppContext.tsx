import React, { createContext, useCallback, useContext, useEffect, useReducer } from "react";

export type TransactionCategory =
  | "food" | "transport" | "shopping" | "health" | "entertainment"
  | "education" | "bills" | "salary" | "freelance" | "investment" | "savings" | "other";

export interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: TransactionCategory;
  note: string;
  date: string;
  createdAt: string;
}

export interface Budget {
  category: TransactionCategory;
  limit: number;
  spent: number;
  period: "monthly";
}

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  icon: string;
  color: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface Profile {
  name: string;
  avatar?: string;
  startingBalance: number;
  isOnboarded: boolean;
  level: number;
  xp: number;
  streak: number;
  badges: string[];
  currency: string;
}

interface AppState {
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  chatHistory: ChatMessage[];
  profile: Profile;
}

type Action =
  | { type: "LOAD"; payload: AppState }
  | { type: "ADD_TRANSACTION"; payload: Transaction }
  | { type: "DELETE_TRANSACTION"; payload: string }
  | { type: "UPSERT_BUDGET"; payload: Budget }
  | { type: "ADD_GOAL"; payload: Goal }
  | { type: "UPDATE_GOAL"; payload: { id: string; currentAmount: number } }
  | { type: "DELETE_GOAL"; payload: string }
  | { type: "ADD_CHAT"; payload: ChatMessage }
  | { type: "CLEAR_CHAT" }
  | { type: "UPDATE_PROFILE"; payload: Partial<Profile> }
  | { type: "COMPLETE_ONBOARDING"; payload: { name: string; startingBalance: number } };

const defaultProfile: Profile = {
  name: "User",
  startingBalance: 0,
  isOnboarded: false,
  level: 1,
  xp: 0,
  streak: 1,
  badges: [],
  currency: "Rs.",
};

const initialState: AppState = {
  transactions: [],
  budgets: [],
  goals: [],
  chatHistory: [],
  profile: defaultProfile,
};

function calcXpGain(type: "income" | "expense"): number {
  return type === "income" ? 15 : 10;
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "LOAD":
      return action.payload;
    case "ADD_TRANSACTION": {
      const xpGain = calcXpGain(action.payload.type);
      const newXp = state.profile.xp + xpGain;
      const newLevel = Math.floor(newXp / 100) + 1;
      const updatedBudgets = state.budgets.map((b) => {
        if (action.payload.type === "expense" && b.category === action.payload.category) {
          return { ...b, spent: b.spent + action.payload.amount };
        }
        return b;
      });
      return {
        ...state,
        transactions: [action.payload, ...state.transactions],
        budgets: updatedBudgets,
        profile: { ...state.profile, xp: newXp, level: newLevel },
      };
    }
    case "DELETE_TRANSACTION": {
      const tx = state.transactions.find((t) => t.id === action.payload);
      const updatedBudgets = tx
        ? state.budgets.map((b) =>
            tx.type === "expense" && b.category === tx.category
              ? { ...b, spent: Math.max(0, b.spent - tx.amount) }
              : b
          )
        : state.budgets;
      return {
        ...state,
        transactions: state.transactions.filter((t) => t.id !== action.payload),
        budgets: updatedBudgets,
      };
    }
    case "UPSERT_BUDGET": {
      const exists = state.budgets.find((b) => b.category === action.payload.category);
      return {
        ...state,
        budgets: exists
          ? state.budgets.map((b) =>
              b.category === action.payload.category ? action.payload : b
            )
          : [...state.budgets, action.payload],
      };
    }
    case "ADD_GOAL":
      return { ...state, goals: [...state.goals, action.payload] };
    case "UPDATE_GOAL":
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.payload.id
            ? { ...g, currentAmount: action.payload.currentAmount }
            : g
        ),
      };
    case "DELETE_GOAL":
      return { ...state, goals: state.goals.filter((g) => g.id !== action.payload) };
    case "ADD_CHAT":
      return { ...state, chatHistory: [...state.chatHistory, action.payload] };
    case "CLEAR_CHAT":
      return { ...state, chatHistory: [] };
    case "UPDATE_PROFILE":
      return { ...state, profile: { ...state.profile, ...action.payload } };
    case "COMPLETE_ONBOARDING":
      return {
        ...state,
        profile: {
          ...state.profile,
          name: action.payload.name,
          startingBalance: action.payload.startingBalance,
          isOnboarded: true,
        },
      };
    default:
      return state;
  }
}

interface AppContextValue {
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  chatHistory: ChatMessage[];
  profile: Profile;
  addTransaction: (t: Omit<Transaction, "id" | "createdAt">) => void;
  deleteTransaction: (id: string) => void;
  upsertBudget: (b: Omit<Budget, "spent">) => void;
  addGoal: (g: Omit<Goal, "id" | "createdAt">) => void;
  updateGoalAmount: (id: string, amount: number) => void;
  deleteGoal: (id: string) => void;
  addChatMessage: (m: Omit<ChatMessage, "id">) => void;
  clearChatHistory: () => void;
  updateProfile: (p: Partial<Profile>) => void;
  completeOnboarding: (name: string, startingBalance: number) => void;
  getBalance: () => number;
  getMonthlyIncome: () => number;
  getMonthlyExpenses: () => number;
  getCategorySpending: () => Record<string, number>;
}

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_KEY = "cashbuddy_web_state";

function loadFromStorage(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      transactions: parsed.transactions ?? [],
      budgets: parsed.budgets ?? [],
      goals: parsed.goals ?? [],
      chatHistory: parsed.chatHistory ?? [],
      profile: { ...defaultProfile, ...(parsed.profile ?? {}) },
    };
  } catch {
    return initialState;
  }
}

function saveToStorage(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [loaded, setLoaded] = React.useState(false);

  useEffect(() => {
    const saved = loadFromStorage();
    dispatch({ type: "LOAD", payload: saved });
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveToStorage(state);
  }, [state, loaded]);

  const addTransaction = useCallback((t: Omit<Transaction, "id" | "createdAt">) => {
    dispatch({
      type: "ADD_TRANSACTION",
      payload: { ...t, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
    });
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    dispatch({ type: "DELETE_TRANSACTION", payload: id });
  }, []);

  const upsertBudget = useCallback((b: Omit<Budget, "spent">) => {
    const existing = state.budgets.find((x) => x.category === b.category);
    dispatch({ type: "UPSERT_BUDGET", payload: { ...b, spent: existing?.spent ?? 0 } });
  }, [state.budgets]);

  const addGoal = useCallback((g: Omit<Goal, "id" | "createdAt">) => {
    dispatch({
      type: "ADD_GOAL",
      payload: { ...g, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
    });
  }, []);

  const updateGoalAmount = useCallback((id: string, amount: number) => {
    dispatch({ type: "UPDATE_GOAL", payload: { id, currentAmount: amount } });
  }, []);

  const deleteGoal = useCallback((id: string) => {
    dispatch({ type: "DELETE_GOAL", payload: id });
  }, []);

  const addChatMessage = useCallback((m: Omit<ChatMessage, "id">) => {
    dispatch({
      type: "ADD_CHAT",
      payload: { ...m, id: crypto.randomUUID() },
    });
  }, []);

  const clearChatHistory = useCallback(() => {
    dispatch({ type: "CLEAR_CHAT" });
  }, []);

  const updateProfile = useCallback((p: Partial<Profile>) => {
    dispatch({ type: "UPDATE_PROFILE", payload: p });
  }, []);

  const completeOnboarding = useCallback((name: string, startingBalance: number) => {
    dispatch({ type: "COMPLETE_ONBOARDING", payload: { name, startingBalance } });
  }, []);

  const getBalance = useCallback(() => {
    const net = state.transactions.reduce(
      (sum, t) => sum + (t.type === "income" ? t.amount : -t.amount),
      0
    );
    return state.profile.startingBalance + net;
  }, [state.transactions, state.profile.startingBalance]);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const getMonthlyIncome = useCallback(() => {
    return state.transactions
      .filter((t) => t.type === "income" && t.date >= monthStart)
      .reduce((s, t) => s + t.amount, 0);
  }, [state.transactions, monthStart]);

  const getMonthlyExpenses = useCallback(() => {
    return state.transactions
      .filter((t) => t.type === "expense" && t.date >= monthStart)
      .reduce((s, t) => s + t.amount, 0);
  }, [state.transactions, monthStart]);

  const getCategorySpending = useCallback(() => {
    const map: Record<string, number> = {};
    state.transactions
      .filter((t) => t.type === "expense" && t.date >= monthStart)
      .forEach((t) => {
        map[t.category] = (map[t.category] ?? 0) + t.amount;
      });
    return map;
  }, [state.transactions, monthStart]);

  if (!loaded) return null;

  return (
    <AppContext.Provider
      value={{
        transactions: state.transactions,
        budgets: state.budgets,
        goals: state.goals,
        chatHistory: state.chatHistory,
        profile: state.profile,
        addTransaction,
        deleteTransaction,
        upsertBudget,
        addGoal,
        updateGoalAmount,
        deleteGoal,
        addChatMessage,
        clearChatHistory,
        updateProfile,
        completeOnboarding,
        getBalance,
        getMonthlyIncome,
        getMonthlyExpenses,
        getCategorySpending,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}
