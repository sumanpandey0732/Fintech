import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BalanceCard } from "@/components/BalanceCard";
import { BudgetRingsRow } from "@/components/BudgetRingsRow";
import { GradientBackground } from "@/components/GradientBackground";
import { SmartInsightCard } from "@/components/SmartInsightCard";
import { TransactionItem } from "@/components/TransactionItem";
import { WeeklyHeatmap } from "@/components/WeeklyHeatmap";
import COLORS from "@/constants/colors";
import { CATEGORY_CONFIG, formatAmount, EXPENSE_CATEGORIES } from "@/constants/categories";
import { useApp, TransactionCategory } from "@/context/AppContext";
import { sendLowBalanceAlert, sendTransactionConfirmation } from "@/utils/notifications";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Quick expense shortcuts - common amounts and categories
const QUICK_EXPENSES = [
  { amount: 50, category: "food" as TransactionCategory, label: "Tea/Coffee", icon: "coffee" },
  { amount: 100, category: "food" as TransactionCategory, label: "Snacks", icon: "shopping-bag" },
  { amount: 150, category: "transport" as TransactionCategory, label: "Local Ride", icon: "navigation" },
  { amount: 500, category: "food" as TransactionCategory, label: "Lunch", icon: "coffee" },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 5) return "Late night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

function buildHeatmapData(transactions: any[]) {
  const now = new Date();
  const result: { label: string; amount: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const total = transactions
      .filter((t) => t.type === "expense" && t.date.slice(0, 10) === key)
      .reduce((s: number, t: any) => s + t.amount, 0);
    result.push({ label: DAYS[(d.getDay() + 6) % 7], amount: Math.round(total) });
  }
  return result;
}

function buildInsights(opts: {
  balance: number;
  income: number;
  expenses: number;
  savingsRate: number;
  topCategory: [string, number] | undefined;
  streak: number;
  transactions: any[];
}) {
  const insights = [];
  const { balance, income, expenses, savingsRate, topCategory, streak, transactions } = opts;

  if (savingsRate >= 30) {
    insights.push({
      icon: "🏆",
      color: "#FFD700",
      gradient: ["#1A2A0A", "#2E5916"] as [string, string],
      title: "Excellent Savings Rate!",
      body: `You're saving ${savingsRate.toFixed(0)}% of your income. That puts you in the top tier of savers!`,
    });
  } else if (savingsRate > 0) {
    insights.push({
      icon: "💡",
      color: "#FFA726",
      gradient: ["#1A1200", "#3E2800"] as [string, string],
      title: "Boost Your Savings",
      body: `Current savings rate: ${savingsRate.toFixed(0)}%. Aim for 20%+ by reducing your top spending category.`,
    });
  }

  if (topCategory) {
    const cfg = CATEGORY_CONFIG[topCategory[0] as any];
    insights.push({
      icon: cfg?.icon ?? "💸",
      color: "#1565C0",
      gradient: ["#0D1B4B", "#1A2A6C"] as [string, string],
      title: `Top Spend: ${cfg?.label ?? topCategory[0]}`,
      body: `You spent Rs. ${topCategory[1].toLocaleString("en-NP")} on ${cfg?.label ?? topCategory[0]} this month. Consider setting a budget limit.`,
    });
  }

  if (streak >= 7) {
    insights.push({
      icon: "🔥",
      color: "#FF5722",
      gradient: ["#1A0800", "#3E1500"] as [string, string],
      title: `${streak}-Day Streak! Amazing!`,
      body: "You've been tracking every day! Consistency is the key to financial freedom.",
    });
  } else if (streak >= 3) {
    insights.push({
      icon: "⚡",
      color: COLORS.accent,
      gradient: ["#0D1440", "#1A2060"] as [string, string],
      title: `${streak}-Day Streak!`,
      body: "Keep it up! Daily tracking builds better money habits over time.",
    });
  }

  if (balance < 0) {
    insights.push({
      icon: "⚠️",
      color: "#EF5350",
      gradient: ["#1A0000", "#3E0000"] as [string, string],
      title: "Negative Balance Alert",
      body: "Your balance is below zero. Review your expenses and consider reducing non-essential spending immediately.",
    });
  } else if (balance < 5000) {
    insights.push({
      icon: "🔔",
      color: "#FFA726",
      gradient: ["#1A0E00", "#3E2200"] as [string, string],
      title: "Low Balance Warning",
      body: `Only Rs. ${balance.toLocaleString("en-NP")} remaining. Avoid unnecessary purchases until income arrives.`,
    });
  }

  if (income === 0 && expenses > 0) {
    insights.push({
      icon: "📥",
      color: "#66BB6A",
      gradient: ["#001A06", "#003D0E"] as [string, string],
      title: "Add Income Records",
      body: "You have expenses logged but no income this month. Add your salary or income sources for accurate insights.",
    });
  }

  if (transactions.length === 0) {
    insights.push({
      icon: "🚀",
      color: COLORS.primaryLight,
      gradient: ["#0D1B4B", "#1565C0"] as [string, string],
      title: "Welcome to CashBuddy Nepal Pro!",
      body: "Start by adding your first transaction. Track daily expenses to unlock powerful AI-powered insights.",
    });
  }

  return insights.length ? insights : [{
    icon: "✅",
    color: "#66BB6A",
    gradient: ["#001A06", "#003D0E"] as [string, string],
    title: "All Good!",
    body: "Your finances look balanced. Keep tracking daily to maintain your financial health.",
  }];
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const {
    transactions,
    profile,
    getBalance,
    getMonthlyIncome,
    getMonthlyExpenses,
    getCategorySpending,
    budgets,
    goals,
    addTransaction,
  } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [showQuickExpense, setShowQuickExpense] = useState(false);
  const [quickExpenseAmount, setQuickExpenseAmount] = useState("");
  const [selectedQuickCategory, setSelectedQuickCategory] = useState<TransactionCategory>("food");

  // Quick expense handler
  const handleQuickExpense = async (amount: number, category: TransactionCategory, label: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    await addTransaction({
      type: "expense",
      amount,
      category,
      note: label,
      date: new Date().toISOString(),
      tags: [],
      recurring: "none",
    });

    await sendTransactionConfirmation("expense", amount, CATEGORY_CONFIG[category].label);

    // Check for low balance
    const newBalance = getBalance() - amount;
    if (newBalance < 0) {
      await sendLowBalanceAlert(newBalance, "critical");
    } else if (newBalance < 5000) {
      await sendLowBalanceAlert(newBalance, "low");
    }

    Alert.alert("Quick Expense Added", `Rs. ${amount} for ${label} recorded!`);
  };

  const handleCustomQuickExpense = async () => {
    const parsed = parseFloat(quickExpenseAmount);
    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount");
      return;
    }

    await handleQuickExpense(parsed, selectedQuickCategory, CATEGORY_CONFIG[selectedQuickCategory].label);
    setShowQuickExpense(false);
    setQuickExpenseAmount("");
  };

  const balance = getBalance();
  const income = getMonthlyIncome();
  const expenses = getMonthlyExpenses();
  const savings = income - expenses;
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;
  const savingsRateStr = savingsRate.toFixed(0);
  const recentTx = transactions.slice(0, 5);
  const topPadding = Platform.OS === "web" ? 67 : insets.top + 16;

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const alertBudgets = budgets.filter((b) => b.spent / b.limit >= 0.8 && b.limit > 0);
  const nearGoal = goals.find(
    (g) => g.currentAmount / g.targetAmount >= 0.9 && g.currentAmount < g.targetAmount
  );

  const categorySpending = getCategorySpending();
  const topCategory = Object.entries(categorySpending).sort(([, a], [, b]) => b - a)[0] as [string, number] | undefined;

  const heatmapData = buildHeatmapData(transactions);
  const maxHeatmap = Math.max(...heatmapData.map((d) => d.amount), 1);

  const smartInsights = buildInsights({
    balance,
    income,
    expenses,
    savingsRate,
    topCategory,
    streak: profile.streak,
    transactions,
  });

  const todayExpenses = transactions
    .filter((t) => t.type === "expense" && t.date.slice(0, 10) === new Date().toISOString().slice(0, 10))
    .reduce((s, t) => s + t.amount, 0);

  return (
    <GradientBackground colors={["#060D1F", "#0A1628", "#0D1B4B"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primaryLight}
          />
        }
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(500)}
          style={[styles.header, { paddingTop: topPadding }]}
        >
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{profile.name.split(" ")[0] || "Friend"}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.notifBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/ai-chat");
              }}
            >
              <Feather name="message-circle" size={20} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.notifBtn, { backgroundColor: COLORS.accent + "22" }]}
            >
              <Feather name="bell" size={20} color={COLORS.accent} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Level + streak + today spend */}
        <Animated.View entering={FadeInDown.delay(80).duration(500)} style={styles.levelRow}>
          <View style={styles.levelBadge}>
            <Feather name="zap" size={12} color={COLORS.accent} />
            <Text style={styles.levelText}>Lv.{profile.level} · {profile.xp} XP</Text>
          </View>
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>🔥 {profile.streak}d streak</Text>
          </View>
          {todayExpenses > 0 && (
            <View style={styles.todayBadge}>
              <Text style={styles.todayText}>Today: {formatAmount(todayExpenses)}</Text>
            </View>
          )}
        </Animated.View>

        {/* Balance Card */}
        <Animated.View entering={FadeInUp.delay(120).duration(600)} style={{ marginBottom: 20 }}>
          <BalanceCard balance={balance} income={income} expenses={expenses} />
        </Animated.View>

        {/* Monthly Insights Row */}
        {(income > 0 || expenses > 0) && (
          <Animated.View entering={FadeInDown.delay(160).duration(500)} style={styles.insightRow}>
            <InsightCard
              icon="pie-chart"
              label="Savings"
              value={`${savingsRateStr}%`}
              color={savingsRate >= 20 ? COLORS.success : COLORS.accentOrange}
              sub={savingsRate >= 20 ? "Healthy ✓" : "Improve"}
            />
            <InsightCard
              icon="trending-down"
              label="Top Spend"
              value={topCategory ? CATEGORY_CONFIG[topCategory[0] as any]?.label ?? "—" : "—"}
              color={COLORS.primaryLight}
              sub={topCategory ? formatAmount(topCategory[1]) : "No data"}
            />
            <InsightCard
              icon="target"
              label="Goals"
              value={`${goals.length}`}
              color={COLORS.accent}
              sub={`${goals.filter((g) => g.currentAmount >= g.targetAmount).length} done`}
            />
          </Animated.View>
        )}

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.quickActions}>
          <QuickAction icon="plus" label="Add" color={COLORS.success} onPress={() => router.push("/add-transaction")} />
          <QuickAction icon="bar-chart-2" label="Analytics" color={COLORS.primaryLight} onPress={() => router.push("/(tabs)/analytics")} />
          <QuickAction icon="target" label="Goals" color={COLORS.accent} onPress={() => router.push("/(tabs)/goals")} />
          <QuickAction icon="cpu" label="AI Tips" color="#A78BFA" onPress={() => router.push("/ai-chat")} />
          <QuickAction icon="shield" label="Budget" color={COLORS.accentOrange} onPress={() => router.push("/budget-setup")} />
        </Animated.View>

        {/* Quick Expense Shortcuts - NEW FEATURE */}
        <Animated.View entering={FadeInDown.delay(210).duration(500)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Expense</Text>
            <TouchableOpacity onPress={() => setShowQuickExpense(true)}>
              <Text style={styles.seeAll}>Custom +</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.quickExpenseRow}>
            {QUICK_EXPENSES.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.quickExpenseCard}
                onPress={() => handleQuickExpense(item.amount, item.category, item.label)}
                activeOpacity={0.75}
              >
                <View style={[styles.quickExpenseIcon, { backgroundColor: CATEGORY_CONFIG[item.category].color + "22" }]}>
                  <Feather name={item.icon as any} size={18} color={CATEGORY_CONFIG[item.category].color} />
                </View>
                <Text style={styles.quickExpenseLabel} numberOfLines={1}>{item.label}</Text>
                <Text style={styles.quickExpenseAmount}>Rs.{item.amount}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Smart Insights Carousel */}
        <Animated.View entering={FadeInDown.delay(230).duration(500)}>
          <SmartInsightCard insights={smartInsights} />
        </Animated.View>

        {/* Budget Rings */}
        {budgets.filter((b) => b.limit > 0).length > 0 && (
          <Animated.View entering={FadeInDown.delay(260).duration(500)}>
            <BudgetRingsRow budgets={budgets} />
          </Animated.View>
        )}

        {/* Weekly Heatmap */}
        <Animated.View entering={FadeInDown.delay(290).duration(500)}>
          <WeeklyHeatmap data={heatmapData} maxAmount={maxHeatmap} />
        </Animated.View>

        {/* Alerts */}
        {(alertBudgets.length > 0 || nearGoal) && (
          <Animated.View entering={FadeInDown.delay(320).duration(500)} style={styles.section}>
            <Text style={styles.sectionTitle}>Alerts</Text>
            {alertBudgets.slice(0, 2).map((b) => (
              <View key={b.category} style={styles.alertCard}>
                <View style={[styles.alertDot, { backgroundColor: b.spent >= b.limit ? COLORS.error : COLORS.accentOrange }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertText}>
                    {CATEGORY_CONFIG[b.category].label} budget {b.spent >= b.limit ? "exceeded" : "80% used"}
                  </Text>
                  <Text style={styles.alertSub}>
                    {formatAmount(b.spent)} / {formatAmount(b.limit)} spent
                  </Text>
                </View>
                <Feather name="alert-circle" size={16} color={b.spent >= b.limit ? COLORS.error : COLORS.accentOrange} />
              </View>
            ))}
            {nearGoal && (
              <View style={[styles.alertCard, { borderColor: COLORS.success + "44" }]}>
                <View style={[styles.alertDot, { backgroundColor: COLORS.success }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertText}>{nearGoal.title} almost complete!</Text>
                  <Text style={styles.alertSub}>
                    {formatAmount(nearGoal.currentAmount)} / {formatAmount(nearGoal.targetAmount)}
                  </Text>
                </View>
                <Feather name="award" size={16} color={COLORS.success} />
              </View>
            )}
          </Animated.View>
        )}

        {/* Recent Transactions */}
        <Animated.View entering={FadeInDown.delay(350).duration(500)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/analytics")}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentTx.length === 0 ? (
            <View style={styles.emptyBox}>
              <LinearGradient colors={["#0D47A1", "#1565C0"]} style={styles.emptyIcon}>
                <Feather name="plus-circle" size={28} color={COLORS.white} />
              </LinearGradient>
              <Text style={styles.emptyTitle}>No transactions yet</Text>
              <Text style={styles.emptySubtitle}>
                Start tracking your income and expenses to see insights here.
              </Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push("/add-transaction")}>
                <Text style={styles.emptyBtnText}>Add First Transaction</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.txList}>
              {recentTx.map((t) => (
                <TransactionItem
                  key={t.id}
                  transaction={t}
                  onPress={() => router.push({ pathname: "/transaction-detail", params: { id: t.id } })}
                />
              ))}
            </View>
          )}
        </Animated.View>

        {/* Financial Health Card */}
        {transactions.length > 0 && (
          <Animated.View entering={FadeInDown.delay(380).duration(500)} style={styles.section}>
            <Text style={styles.sectionTitle}>Financial Health</Text>
            <LinearGradient
              colors={["#0D1B4B", "#1565C0"]}
              style={styles.healthCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.healthRow}>
                <HealthItem label="Balance" value={balance >= 0 ? "Good" : "Negative"} ok={balance >= 0} />
                <HealthItem label="Savings" value={savingsRate >= 20 ? "Healthy" : "Low"} ok={savingsRate >= 20} />
                <HealthItem label="Tracking" value={transactions.length >= 5 ? "Active" : "Start"} ok={transactions.length >= 5} />
                <HealthItem label="Goals" value={goals.length > 0 ? "Set" : "None"} ok={goals.length > 0} />
              </View>
              <TouchableOpacity style={styles.healthBtn} onPress={() => router.push("/ai-chat")}>
                <Feather name="cpu" size={14} color={COLORS.white} />
                <Text style={styles.healthBtnText}>Get AI Advice</Text>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable
        style={({ pressed }) => [styles.fab, { opacity: pressed ? 0.8 : 1 }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push("/add-transaction");
        }}
      >
        <Feather name="plus" size={26} color={COLORS.white} />
      </Pressable>

      {/* Quick Expense Modal */}
      <Modal
        visible={showQuickExpense}
        transparent
        animationType="slide"
        onRequestClose={() => setShowQuickExpense(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Quick Expense</Text>
              <TouchableOpacity onPress={() => setShowQuickExpense(false)}>
                <Feather name="x" size={24} color={COLORS.white} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Amount (Rs.)</Text>
            <TextInput
              style={styles.modalInput}
              value={quickExpenseAmount}
              onChangeText={setQuickExpenseAmount}
              keyboardType="decimal-pad"
              placeholder="Enter amount"
              placeholderTextColor={COLORS.darkTextSecondary}
            />

            <Text style={styles.modalLabel}>Category</Text>
            <View style={styles.categoryGrid}>
              {EXPENSE_CATEGORIES.slice(0, 6).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    selectedQuickCategory === cat && { backgroundColor: CATEGORY_CONFIG[cat].color + "33", borderColor: CATEGORY_CONFIG[cat].color },
                  ]}
                  onPress={() => setSelectedQuickCategory(cat)}
                >
                  <Feather name={CATEGORY_CONFIG[cat].icon as any} size={16} color={selectedQuickCategory === cat ? CATEGORY_CONFIG[cat].color : COLORS.darkTextSecondary} />
                  <Text style={[styles.categoryChipText, selectedQuickCategory === cat && { color: CATEGORY_CONFIG[cat].color }]}>
                    {CATEGORY_CONFIG[cat].label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.modalButton} onPress={handleCustomQuickExpense}>
              <LinearGradient
                colors={["#B71C1C", "#EF5350"]}
                style={styles.modalButtonInner}
              >
                <Feather name="arrow-down-circle" size={20} color={COLORS.white} />
                <Text style={styles.modalButtonText}>Add Expense</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </GradientBackground>
  );
}

function InsightCard({ icon, label, value, color, sub }: {
  icon: string; label: string; value: string; color: string; sub: string;
}) {
  return (
    <View style={iStyles.card}>
      <View style={[iStyles.icon, { backgroundColor: color + "22" }]}>
        <Feather name={icon as any} size={16} color={color} />
      </View>
      <Text style={iStyles.value}>{value}</Text>
      <Text style={iStyles.label}>{label}</Text>
      <Text style={[iStyles.sub, { color }]}>{sub}</Text>
    </View>
  );
}

const iStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: COLORS.darkCard,
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  icon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  value: { color: COLORS.white, fontSize: 14, fontFamily: "Inter_700Bold" },
  label: { color: COLORS.darkTextSecondary, fontSize: 10, fontFamily: "Inter_400Regular" },
  sub: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
});

function HealthItem({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <View style={hStyles.item}>
      <View style={[hStyles.dot, { backgroundColor: ok ? COLORS.success : COLORS.accentOrange }]} />
      <Text style={hStyles.value}>{value}</Text>
      <Text style={hStyles.label}>{label}</Text>
    </View>
  );
}

const hStyles = StyleSheet.create({
  item: { flex: 1, alignItems: "center", gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  value: { color: COLORS.white, fontSize: 12, fontFamily: "Inter_600SemiBold" },
  label: { color: "rgba(255,255,255,0.5)", fontSize: 10, fontFamily: "Inter_400Regular" },
});

function QuickAction({ icon, label, color, onPress }: {
  icon: string; label: string; color: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.qaItem} onPress={onPress} activeOpacity={0.75}>
      <LinearGradient
        colors={[color + "33", color + "11"]}
        style={styles.qaIcon}
      >
        <Feather name={icon as any} size={20} color={color} />
      </LinearGradient>
      <Text style={styles.qaLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  greeting: { color: COLORS.darkTextSecondary, fontSize: 14, fontFamily: "Inter_400Regular" },
  userName: { color: COLORS.white, fontSize: 24, fontFamily: "Inter_700Bold", marginTop: 2 },
  headerActions: { flexDirection: "row", gap: 10 },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.glassWhite,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  levelRow: { flexDirection: "row", paddingHorizontal: 20, gap: 8, marginBottom: 16, flexWrap: "wrap" },
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: COLORS.accent + "18",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.accent + "33",
  },
  levelText: { color: COLORS.accent, fontSize: 12, fontFamily: "Inter_600SemiBold" },
  streakBadge: {
    backgroundColor: COLORS.success + "18",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.success + "33",
  },
  streakText: { color: COLORS.success, fontSize: 12, fontFamily: "Inter_600SemiBold" },
  todayBadge: {
    backgroundColor: COLORS.primaryLight + "18",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primaryLight + "33",
  },
  todayText: { color: COLORS.primaryLight, fontSize: 12, fontFamily: "Inter_600SemiBold" },
  insightRow: { flexDirection: "row", paddingHorizontal: 16, gap: 10, marginBottom: 20 },
  quickActions: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 24 },
  qaItem: { flex: 1, alignItems: "center", gap: 8 },
  qaIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  qaLabel: { color: COLORS.darkTextSecondary, fontSize: 11, fontFamily: "Inter_500Medium" },
  section: { marginBottom: 24, paddingHorizontal: 20 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: { color: COLORS.white, fontSize: 18, fontFamily: "Inter_700Bold" },
  seeAll: { color: COLORS.primaryLight, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  txList: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    overflow: "hidden",
  },
  emptyBox: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    alignItems: "center",
    paddingVertical: 36,
    paddingHorizontal: 24,
    gap: 10,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: { color: COLORS.white, fontSize: 17, fontFamily: "Inter_700Bold" },
  emptySubtitle: {
    color: COLORS.darkTextSecondary,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  emptyBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 4,
  },
  emptyBtnText: { color: COLORS.white, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.darkCard,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.error + "33",
  },
  alertDot: { width: 8, height: 8, borderRadius: 4 },
  alertText: { color: COLORS.darkText, fontSize: 14, fontFamily: "Inter_500Medium" },
  alertSub: { color: COLORS.darkTextSecondary, fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  healthCard: {
    borderRadius: 20,
    padding: 20,
    gap: 16,
    overflow: "hidden",
  },
  healthRow: { flexDirection: "row", justifyContent: "space-around" },
  healthBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    paddingVertical: 10,
  },
  healthBtnText: { color: COLORS.white, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  fab: {
    position: "absolute",
    bottom: 90,
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 2,
    borderColor: COLORS.primaryLight,
  },
  // Quick Expense styles
  quickExpenseRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  quickExpenseCard: {
    flex: 1,
    minWidth: (SCREEN_WIDTH - 60) / 4,
    backgroundColor: COLORS.darkCard,
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  quickExpenseIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  quickExpenseLabel: {
    color: COLORS.darkTextSecondary,
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  quickExpenseAmount: {
    color: COLORS.error,
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.darkCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  modalLabel: {
    color: COLORS.darkTextSecondary,
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modalInput: {
    backgroundColor: COLORS.darkBg,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.white,
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.darkBg,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    gap: 6,
  },
  categoryChipText: {
    color: COLORS.darkTextSecondary,
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  modalButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 8,
  },
  modalButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
  },
  modalButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
});
