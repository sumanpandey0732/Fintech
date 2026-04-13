import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState, AppStateStatus, Platform } from "react-native";

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
  TRANSACTIONS: "cashbuddy_transactions_v2",
  BUDGETS: "cashbuddy_budgets_v2",
  GOALS: "cashbuddy_goals_v2",
  PROFILE: "cashbuddy_profile_v2",
  CHAT_HISTORY: "cashbuddy_chat_v2",
  LAST_SAVE: "cashbuddy_last_save",
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
  forceSave: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

// Helper function to safely save to AsyncStorage with retry
async function safeSave(key: string, data: unknown, retries = 3): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      const jsonData = JSON.stringify(data);
      await AsyncStorage.setItem(key, jsonData);
      return true;
    } catch (error) {
      console.warn(`[CashBuddy] Save attempt ${i + 1} failed for ${key}:`, error);
      if (i === retries - 1) {
        console.error(`[CashBuddy] Failed to save ${key} after ${retries} attempts`);
        return false;
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
    }
  }
  return false;
}

// Helper function to safely load from AsyncStorage
async function safeLoad<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed as T;
    }
    return defaultValue;
  } catch (error) {
    console.warn(`[CashBuddy] Failed to load ${key}:`, error);
    return defaultValue;
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<SavingGoal[]>([]);
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Refs to track pending saves and current state
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dataLoadedRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);

  // Save all data immediately
  const saveAllData = useCallback(async () => {
    if (!dataLoadedRef.current) return;
    
    try {
      await Promise.all([
        safeSave(STORAGE_KEYS.TRANSACTIONS, transactions),
        safeSave(STORAGE_KEYS.BUDGETS, budgets),
        safeSave(STORAGE_KEYS.GOALS, goals),
        safeSave(STORAGE_KEYS.PROFILE, profile),
        safeSave(STORAGE_KEYS.CHAT_HISTORY, chatHistory),
        safeSave(STORAGE_KEYS.LAST_SAVE, new Date().toISOString()),
      ]);
    } catch (error) {
      console.error("[CashBuddy] Error saving all data:", error);
    }
  }, [transactions, budgets, goals, profile, chatHistory]);

  // Force save function exposed to context
  const forceSave = useCallback(async () => {
    await saveAllData();
  }, [saveAllData]);

  // Debounced save - saves after 500ms of no changes
  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveAllData();
    }, 500);
  }, [saveAllData]);

  // Auto-save when data changes
  useEffect(() => {
    if (dataLoadedRef.current && profile.isOnboarded) {
      debouncedSave();
    }
  }, [transactions, budgets, goals, profile, chatHistory, debouncedSave]);

  // Save when app goes to background or is closed
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current.match(/active/) &&
        nextAppState.match(/inactive|background/)
      ) {
        // App is going to background - save immediately
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        await saveAllData();
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      subscription.remove();
      // Save when component unmounts
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveAllData();
    };
  }, [saveAllData]);

  // Load all data on mount
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      // First check if user has completed onboarding
      const savedProfile = await safeLoad<UserProfile | null>(STORAGE_KEYS.PROFILE, null);
      
      // Check for legacy data keys (v1) and migrate if needed
      const legacyProfile = await safeLoad<UserProfile | null>("cashbuddy_profile", null);
      
      if (legacyProfile && legacyProfile.isOnboarded && !savedProfile) {
        // Migrate from v1 to v2
        const [legacyTx, legacyBudgets, legacyGoals, legacyChat] = await Promise.all([
          safeLoad<Transaction[]>("cashbuddy_transactions", []),
          safeLoad<Budget[]>("cashbuddy_budgets", []),
          safeLoad<SavingGoal[]>("cashbuddy_goals", []),
          safeLoad<ChatMessage[]>("cashbuddy_chat", []),
        ]);
        
        // Save to new keys
        await Promise.all([
          safeSave(STORAGE_KEYS.PROFILE, legacyProfile),
          safeSave(STORAGE_KEYS.TRANSACTIONS, legacyTx),
          safeSave(STORAGE_KEYS.BUDGETS, legacyBudgets),
          safeSave(STORAGE_KEYS.GOALS, legacyGoals),
          safeSave(STORAGE_KEYS.CHAT_HISTORY, legacyChat),
        ]);
        
        setTransactions(legacyTx);
        setBudgets(legacyBudgets);
        setGoals(legacyGoals);
        setChatHistory(legacyChat);
        setProfile(legacyProfile);
        dataLoadedRef.current = true;
        setIsLoading(false);
        return;
      }

      // If not yet onboarded, start fresh
      if (!savedProfile || !savedProfile.isOnboarded) {
        setTransactions([]);
        setBudgets([]);
        setGoals([]);
        setChatHistory([]);
        setProfile(defaultProfile);
        dataLoadedRef.current = true;
        setIsLoading(false);
        return;
      }

      // User has completed onboarding - load all data
      const [txData, budgetData, goalData, chatData] = await Promise.all([
        safeLoad<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []),
        safeLoad<Budget[]>(STORAGE_KEYS.BUDGETS, []),
        safeLoad<SavingGoal[]>(STORAGE_KEYS.GOALS, []),
        safeLoad<ChatMessage[]>(STORAGE_KEYS.CHAT_HISTORY, []),
      ]);

      setTransactions(txData);
      setBudgets(budgetData);
      setGoals(goalData);
      setChatHistory(chatData);
      setProfile({ ...defaultProfile, ...savedProfile });
      dataLoadedRef.current = true;
    } catch (e) {
      console.error("[CashBuddy] Error loading data:", e);
      dataLoadedRef.current = true;
    } finally {
      setIsLoading(false);
    }
  };

  const addXP = useCallback(async (amount: number) => {
    setProfile((prev) => {
      const newXp = prev.xp + amount;
      const xpNeeded = getXpForNextLevel(prev.level);
      if (newXp >= xpNeeded) {
        return {
          ...prev,
          xp: newXp - xpNeeded,
          level: prev.level + 1,
        };
      }
      return { ...prev, xp: newXp };
    });
  }, []);

  const unlockAchievement = useCallback(
    async (id: string) => {
      setProfile((prev) => {
        if (prev.achievements.includes(id)) return prev;
        const achievement = ACHIEVEMENTS_LIST.find((a) => a.id === id);
        if (achievement) {
          addXP(achievement.xpReward);
        }
        return {
          ...prev,
          achievements: [...prev.achievements, id],
        };
      });
    },
    [addXP]
  );

  const completeOnboarding = useCallback(async (name: string, startingBalance: number) => {
    const updated: UserProfile = { 
      ...defaultProfile, 
      name, 
      startingBalance, 
      isOnboarded: true,
      lastActiveDate: new Date().toISOString(),
    };
    setProfile(updated);
    // Immediately save onboarding completion
    await safeSave(STORAGE_KEYS.PROFILE, updated);
  }, []);

  const addTransaction = useCallback(
    async (t: Omit<Transaction, "id">) => {
      const newTx: Transaction = {
        ...t,
        id: Crypto.randomUUID(),
      };
      
      setTransactions((prev) => {
        const updated = [newTx, ...prev];
        // Immediately save transactions
        safeSave(STORAGE_KEYS.TRANSACTIONS, updated);
        return updated;
      });

      await addXP(10);

      // Check achievements
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
          safeSave(STORAGE_KEYS.BUDGETS, updated);
          return updated;
        });
      }
    },
    [addXP, unlockAchievement]
  );

  const editTransaction = useCallback(async (id: string, t: Partial<Transaction>) => {
    setTransactions((prev) => {
      const updated = prev.map((tx) => (tx.id === id ? { ...tx, ...t } : tx));
      safeSave(STORAGE_KEYS.TRANSACTIONS, updated);
      return updated;
    });
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    setTransactions((prev) => {
      const updated = prev.filter((tx) => tx.id !== id);
      safeSave(STORAGE_KEYS.TRANSACTIONS, updated);
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
        safeSave(STORAGE_KEYS.BUDGETS, updated);
        return updated;
      });
      await unlockAchievement("budget_setter");
    },
    [unlockAchievement]
  );

  const deleteBudget = useCallback(async (category: TransactionCategory) => {
    setBudgets((prev) => {
      const updated = prev.filter((b) => b.category !== category);
      safeSave(STORAGE_KEYS.BUDGETS, updated);
      return updated;
    });
  }, []);

  const addGoal = useCallback(
    async (g: Omit<SavingGoal, "id">) => {
      const newGoal: SavingGoal = { ...g, id: Crypto.randomUUID() };
      setGoals((prev) => {
        const updated = [...prev, newGoal];
        safeSave(STORAGE_KEYS.GOALS, updated);
        return updated;
      });
      await unlockAchievement("goal_creator");
    },
    [unlockAchievement]
  );

  const updateGoal = useCallback(async (id: string, g: Partial<SavingGoal>) => {
    setGoals((prev) => {
      const updated = prev.map((gl) => (gl.id === id ? { ...gl, ...g } : gl));
      safeSave(STORAGE_KEYS.GOALS, updated);
      return updated;
    });
  }, []);

  const deleteGoal = useCallback(async (id: string) => {
    setGoals((prev) => {
      const updated = prev.filter((g) => g.id !== id);
      safeSave(STORAGE_KEYS.GOALS, updated);
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
        safeSave(STORAGE_KEYS.GOALS, updated);
        return updated;
      });
      await addXP(20);
    },
    [addXP]
  );

  const updateProfile = useCallback(async (p: Partial<UserProfile>) => {
    setProfile((prev) => {
      const updated = { ...prev, ...p };
      safeSave(STORAGE_KEYS.PROFILE, updated);
      return updated;
    });
  }, []);

  const addChatMessage = useCallback((m: Omit<ChatMessage, "id">) => {
    const newMsg: ChatMessage = { ...m, id: Crypto.randomUUID() };
    setChatHistory((prev) => {
      const updated = [...prev, newMsg];
      safeSave(STORAGE_KEYS.CHAT_HISTORY, updated);
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
        forceSave,
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
