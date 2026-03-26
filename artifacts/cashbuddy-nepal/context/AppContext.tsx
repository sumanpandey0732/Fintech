import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type TransactionCategory =
  | "food"
  | "transport"
  | "shopping"
  | "health"
  | "entertainment"
  | "education"
  | "bills"
  | "salary"
  | "freelance"
  | "investment"
  | "savings"
  | "other";

export type TransactionType = "income" | "expense";

export type RecurringFrequency = "daily" | "weekly" | "monthly" | "none";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: TransactionCategory;
  note: string;
  date: string;
  tags: string[];
  recurring: RecurringFrequency;
}

export interface Budget {
  category: TransactionCategory;
  limit: number;
  spent: number;
}

export interface SavingGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  icon: string;
  color: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  xpReward: number;
}

export interface UserProfile {
  name: string;
  avatar: string;
  level: number;
  xp: number;
  streak: number;
  lastActiveDate: string;
  achievements: string[];
  darkMode: boolean;
  currency: string;
  startingBalance: number;
  isOnboarded: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const STORAGE_KEYS = {
  TRANSACTIONS: "cashbuddy_transactions",
  BUDGETS: "cashbuddy_budgets",
  GOALS: "cashbuddy_goals",
  PROFILE: "cashbuddy_profile",
  CHAT_HISTORY: "cashbuddy_chat",
};

const ACHIEVEMENTS_LIST: Achievement[] = [
  {
    id: "first_transaction",
    title: "First Step",
    description: "Add your first transaction",
    icon: "star",
    xpReward: 50,
  },
  {
    id: "budget_setter",
    title: "Budget Boss",
    description: "Set your first budget",
    icon: "shield",
    xpReward: 100,
  },
  {
    id: "goal_creator",
    title: "Dream Saver",
    description: "Create your first saving goal",
    icon: "target",
    xpReward: 100,
  },
  {
    id: "streak_3",
    title: "On Fire",
    description: "3 day streak",
    icon: "zap",
    xpReward: 150,
  },
  {
    id: "streak_7",
    title: "Weekly Warrior",
    description: "7 day streak",
    icon: "award",
    xpReward: 300,
  },
  {
    id: "saver_1000",
    title: "Rs. 1000 Saver",
    description: "Save Rs. 1000 in goals",
    icon: "trending-up",
    xpReward: 200,
  },
  {
    id: "transactions_10",
    title: "Active Tracker",
    description: "Log 10 transactions",
    icon: "check-circle",
    xpReward: 150,
  },
  {
    id: "no_overspend",
    title: "Budget Ninja",
    description: "Stay within budget all month",
    icon: "shield-off",
    xpReward: 500,
  },
];

const LEVEL_TITLES = [
  "Beginner",
  "Saver",
  "Budgeter",
  "Tracker",
  "Planner",
  "Expert",
  "Master",
  "Legend",
  "Master Saver",
];

export function getLevelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];
}

export function getXpForNextLevel(level: number): number {
  return level * 500;
}

const defaultProfile: UserProfile = {
  name: "",
  avatar: "user",
  level: 1,
  xp: 0,
  streak: 0,
  lastActiveDate: "",
  achievements: [],
  darkMode: true,
  currency: "Rs.",
  startingBalance: 0,
  isOnboarded: false,
};

interface AppContextType {
  transactions: Transaction[];
  budgets: Budget[];
  goals: SavingGoal[];
  profile: UserProfile;
  chatHistory: ChatMessage[];
  achievements: Achievement[];

  addTransaction: (t: Omit<Transaction, "id">) => Promise<void>;
  editTransaction: (id: string, t: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  setBudget: (b: Budget) => Promise<void>;
  deleteBudget: (category: TransactionCategory) => Promise<void>;

  addGoal: (g: Omit<SavingGoal, "id">) => Promise<void>;
  updateGoal: (id: string, g: Partial<SavingGoal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  addToGoal: (id: string, amount: number) => Promise<void>;

  updateProfile: (p: Partial<UserProfile>) => Promise<void>;
  completeOnboarding: (name: string, startingBalance: number) => Promise<void>;
  addChatMessage: (m: Omit<ChatMessage, "id">) => void;
  clearChatHistory: () => void;

  getBalance: () => number;
  getMonthlyIncome: () => number;
  getMonthlyExpenses: () => number;
  getCategorySpending: () => Record<string, number>;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<SavingGoal[]>([]);
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const profileRaw = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE);
      const savedProfile = profileRaw ? JSON.parse(profileRaw) : null;

      // If not yet onboarded (new onboarding system), wipe ALL old data
      // This removes any legacy demo/seeded data from previous sessions
      if (!savedProfile || !savedProfile.isOnboarded) {
        await AsyncStorage.multiRemove([
          STORAGE_KEYS.TRANSACTIONS,
          STORAGE_KEYS.BUDGETS,
          STORAGE_KEYS.GOALS,
          STORAGE_KEYS.CHAT_HISTORY,
          STORAGE_KEYS.PROFILE,
        ]);
        setTransactions([]);
        setBudgets([]);
        setGoals([]);
        setChatHistory([]);
        setProfile(defaultProfile);
        setIsLoading(false);
        return;
      }

      // User has completed onboarding — load their real data
      const [txRaw, budgetRaw, goalRaw, chatRaw] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS),
        AsyncStorage.getItem(STORAGE_KEYS.BUDGETS),
        AsyncStorage.getItem(STORAGE_KEYS.GOALS),
        AsyncStorage.getItem(STORAGE_KEYS.CHAT_HISTORY),
      ]);

      if (txRaw) setTransactions(JSON.parse(txRaw));
      if (budgetRaw) setBudgets(JSON.parse(budgetRaw));
      if (goalRaw) setGoals(JSON.parse(goalRaw));
      if (chatRaw) setChatHistory(JSON.parse(chatRaw));
      setProfile({ ...defaultProfile, ...savedProfile });
    } catch (e) {
    } finally {
      setIsLoading(false);
    }
  };

  const addXP = useCallback(async (amount: number) => {
    setProfile((prev) => {
      const newXp = prev.xp + amount;
      const xpNeeded = getXpForNextLevel(prev.level);
      if (newXp >= xpNeeded) {
        const updated = {
          ...prev,
          xp: newXp - xpNeeded,
          level: prev.level + 1,
        };
        AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updated));
        return updated;
      }
      const updated = { ...prev, xp: newXp };
      AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const unlockAchievement = useCallback(
    async (id: string) => {
      setProfile((prev) => {
        if (prev.achievements.includes(id)) return prev;
        const achievement = ACHIEVEMENTS_LIST.find((a) => a.id === id);
        const updated = {
          ...prev,
          achievements: [...prev.achievements, id],
        };
        AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updated));
        if (achievement) addXP(achievement.xpReward);
        return updated;
      });
    },
    [addXP]
  );

  const completeOnboarding = useCallback(async (name: string, startingBalance: number) => {
    const updated = { ...defaultProfile, name, startingBalance, isOnboarded: true };
    setProfile(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updated));
  }, []);

  const addTransaction = useCallback(
    async (t: Omit<Transaction, "id">) => {
      const newTx: Transaction = {
        ...t,
        id: Crypto.randomUUID(),
      };
      setTransactions((prev) => {
        const updated = [newTx, ...prev];
        AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updated));
        return updated;
      });

      await addXP(10);

      setTransactions((prev) => {
        if (prev.length >= 10) unlockAchievement("transactions_10");
        if (prev.length === 1) unlockAchievement("first_transaction");
        return prev;
      });

      if (t.type === "expense") {
        setBudgets((prev) => {
          const updated = prev.map((b) =>
            b.category === t.category
              ? { ...b, spent: b.spent + t.amount }
              : b
          );
          AsyncStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(updated));
          return updated;
        });
      }
    },
    [addXP, unlockAchievement]
  );

  const editTransaction = useCallback(async (id: string, t: Partial<Transaction>) => {
    setTransactions((prev) => {
      const updated = prev.map((tx) => (tx.id === id ? { ...tx, ...t } : tx));
      AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    setTransactions((prev) => {
      const updated = prev.filter((tx) => tx.id !== id);
      AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const setBudget = useCallback(
    async (b: Budget) => {
      setBudgets((prev) => {
        const existing = prev.findIndex((x) => x.category === b.category);
        let updated: Budget[];
        if (existing >= 0) {
          updated = prev.map((x) => (x.category === b.category ? b : x));
        } else {
          updated = [...prev, b];
        }
        AsyncStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(updated));
        return updated;
      });
      await unlockAchievement("budget_setter");
    },
    [unlockAchievement]
  );

  const deleteBudget = useCallback(async (category: TransactionCategory) => {
    setBudgets((prev) => {
      const updated = prev.filter((b) => b.category !== category);
      AsyncStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const addGoal = useCallback(
    async (g: Omit<SavingGoal, "id">) => {
      const newGoal: SavingGoal = { ...g, id: Crypto.randomUUID() };
      setGoals((prev) => {
        const updated = [...prev, newGoal];
        AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(updated));
        return updated;
      });
      await unlockAchievement("goal_creator");
    },
    [unlockAchievement]
  );

  const updateGoal = useCallback(async (id: string, g: Partial<SavingGoal>) => {
    setGoals((prev) => {
      const updated = prev.map((gl) => (gl.id === id ? { ...gl, ...g } : gl));
      AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteGoal = useCallback(async (id: string) => {
    setGoals((prev) => {
      const updated = prev.filter((g) => g.id !== id);
      AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const addToGoal = useCallback(
    async (id: string, amount: number) => {
      setGoals((prev) => {
        const updated = prev.map((g) =>
          g.id === id
            ? { ...g, currentAmount: Math.min(g.currentAmount + amount, g.targetAmount) }
            : g
        );
        AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(updated));
        return updated;
      });
      await addXP(20);
    },
    [addXP]
  );

  const updateProfile = useCallback(async (p: Partial<UserProfile>) => {
    setProfile((prev) => {
      const updated = { ...prev, ...p };
      AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const addChatMessage = useCallback((m: Omit<ChatMessage, "id">) => {
    const newMsg: ChatMessage = { ...m, id: Crypto.randomUUID() };
    setChatHistory((prev) => {
      const updated = [...prev, newMsg];
      AsyncStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearChatHistory = useCallback(() => {
    setChatHistory([]);
    AsyncStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY);
  }, []);

  const getBalance = useCallback(() => {
    const txBalance = transactions.reduce(
      (sum, t) => (t.type === "income" ? sum + t.amount : sum - t.amount),
      0
    );
    return profile.startingBalance + txBalance;
  }, [transactions, profile.startingBalance]);

  const getMonthlyIncome = useCallback(() => {
    const now = new Date();
    return transactions
      .filter((t) => {
        const d = new Date(t.date);
        return (
          t.type === "income" &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const getMonthlyExpenses = useCallback(() => {
    const now = new Date();
    return transactions
      .filter((t) => {
        const d = new Date(t.date);
        return (
          t.type === "expense" &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const getCategorySpending = useCallback((): Record<string, number> => {
    const now = new Date();
    return transactions
      .filter((t) => {
        const d = new Date(t.date);
        return (
          t.type === "expense" &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      })
      .reduce(
        (acc, t) => ({
          ...acc,
          [t.category]: (acc[t.category] || 0) + t.amount,
        }),
        {} as Record<string, number>
      );
  }, [transactions]);

  return (
    <AppContext.Provider
      value={{
        transactions,
        budgets,
        goals,
        profile,
        chatHistory,
        achievements: ACHIEVEMENTS_LIST,
        addTransaction,
        editTransaction,
        deleteTransaction,
        setBudget,
        deleteBudget,
        addGoal,
        updateGoal,
        deleteGoal,
        addToGoal,
        updateProfile,
        completeOnboarding,
        addChatMessage,
        clearChatHistory,
        getBalance,
        getMonthlyIncome,
        getMonthlyExpenses,
        getCategorySpending,
        isLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
