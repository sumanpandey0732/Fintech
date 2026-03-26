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
  addChatMessage: (m: Omit<ChatMessage, "id">) => void;
  clearChatHistory: () => void;

  getBalance: () => number;
  getMonthlyIncome: () => number;
  getMonthlyExpenses: () => number;
  getCategorySpending: () => Record<string, number>;
  isLoading: boolean;
}

const defaultProfile: UserProfile = {
  name: "Samir Shrestha",
  avatar: "user",
  level: 1,
  xp: 0,
  streak: 0,
  lastActiveDate: "",
  achievements: [],
  darkMode: true,
  currency: "Rs.",
};

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
      const [txRaw, budgetRaw, goalRaw, profileRaw, chatRaw] =
        await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS),
          AsyncStorage.getItem(STORAGE_KEYS.BUDGETS),
          AsyncStorage.getItem(STORAGE_KEYS.GOALS),
          AsyncStorage.getItem(STORAGE_KEYS.PROFILE),
          AsyncStorage.getItem(STORAGE_KEYS.CHAT_HISTORY),
        ]);

      if (txRaw) setTransactions(JSON.parse(txRaw));
      if (budgetRaw) setBudgets(JSON.parse(budgetRaw));
      if (goalRaw) setGoals(JSON.parse(goalRaw));
      if (profileRaw) setProfile({ ...defaultProfile, ...JSON.parse(profileRaw) });
      if (chatRaw) setChatHistory(JSON.parse(chatRaw));

      if (!txRaw) {
        await seedDemoData();
      }
    } catch (e) {
    } finally {
      setIsLoading(false);
    }
  };

  const seedDemoData = async () => {
    const now = new Date();
    const demoTransactions: Transaction[] = [
      {
        id: "demo1",
        type: "income",
        amount: 45000,
        category: "salary",
        note: "Monthly salary",
        date: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
        tags: ["work"],
        recurring: "monthly",
      },
      {
        id: "demo2",
        type: "expense",
        amount: 2500,
        category: "food",
        note: "Grocery shopping",
        date: new Date(now.getFullYear(), now.getMonth(), 3).toISOString(),
        tags: ["grocery"],
        recurring: "none",
      },
      {
        id: "demo3",
        type: "expense",
        amount: 800,
        category: "transport",
        note: "Bus fare",
        date: new Date(now.getFullYear(), now.getMonth(), 5).toISOString(),
        tags: [],
        recurring: "none",
      },
      {
        id: "demo4",
        type: "expense",
        amount: 3200,
        category: "shopping",
        note: "Clothes from New Road",
        date: new Date(now.getFullYear(), now.getMonth(), 8).toISOString(),
        tags: ["clothing"],
        recurring: "none",
      },
      {
        id: "demo5",
        type: "income",
        amount: 12000,
        category: "freelance",
        note: "Web design project",
        date: new Date(now.getFullYear(), now.getMonth(), 10).toISOString(),
        tags: ["work", "design"],
        recurring: "none",
      },
      {
        id: "demo6",
        type: "expense",
        amount: 1500,
        category: "bills",
        note: "Electricity bill",
        date: new Date(now.getFullYear(), now.getMonth(), 12).toISOString(),
        tags: ["utility"],
        recurring: "monthly",
      },
      {
        id: "demo7",
        type: "expense",
        amount: 600,
        category: "entertainment",
        note: "Cinema and snacks",
        date: new Date(now.getFullYear(), now.getMonth(), 15).toISOString(),
        tags: ["fun"],
        recurring: "none",
      },
      {
        id: "demo8",
        type: "expense",
        amount: 1200,
        category: "health",
        note: "Medical checkup",
        date: new Date(now.getFullYear(), now.getMonth(), 18).toISOString(),
        tags: ["medical"],
        recurring: "none",
      },
      {
        id: "demo9",
        type: "expense",
        amount: 900,
        category: "food",
        note: "Restaurant dinner",
        date: new Date(now.getFullYear(), now.getMonth(), 20).toISOString(),
        tags: ["dining"],
        recurring: "none",
      },
      {
        id: "demo10",
        type: "expense",
        amount: 5000,
        category: "education",
        note: "Online course",
        date: new Date(now.getFullYear(), now.getMonth(), 22).toISOString(),
        tags: ["learning"],
        recurring: "none",
      },
    ];

    const demoBudgets: Budget[] = [
      { category: "food", limit: 8000, spent: 3400 },
      { category: "transport", limit: 3000, spent: 800 },
      { category: "shopping", limit: 5000, spent: 3200 },
      { category: "entertainment", limit: 2000, spent: 600 },
      { category: "bills", limit: 5000, spent: 1500 },
    ];

    const demoGoals: SavingGoal[] = [
      {
        id: "goal1",
        title: "New Laptop",
        targetAmount: 80000,
        currentAmount: 25000,
        deadline: new Date(now.getFullYear(), now.getMonth() + 4, 1).toISOString(),
        icon: "monitor",
        color: "#1565C0",
      },
      {
        id: "goal2",
        title: "Vacation to Pokhara",
        targetAmount: 30000,
        currentAmount: 12000,
        deadline: new Date(now.getFullYear(), now.getMonth() + 2, 1).toISOString(),
        icon: "map",
        color: "#00C853",
      },
      {
        id: "goal3",
        title: "Emergency Fund",
        targetAmount: 100000,
        currentAmount: 45000,
        deadline: new Date(now.getFullYear() + 1, 0, 1).toISOString(),
        icon: "shield",
        color: "#FF6D00",
      },
    ];

    setTransactions(demoTransactions);
    setBudgets(demoBudgets);
    setGoals(demoGoals);

    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(demoTransactions)),
      AsyncStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(demoBudgets)),
      AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(demoGoals)),
    ]);
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
    return transactions.reduce(
      (sum, t) => (t.type === "income" ? sum + t.amount : sum - t.amount),
      0
    );
  }, [transactions]);

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
