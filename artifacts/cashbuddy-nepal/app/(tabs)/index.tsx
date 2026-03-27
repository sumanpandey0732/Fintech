import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BalanceCard } from "@/components/BalanceCard";
import { GradientBackground } from "@/components/GradientBackground";
import { TransactionItem } from "@/components/TransactionItem";
import COLORS from "@/constants/colors";
import { CATEGORY_CONFIG, formatAmount } from "@/constants/categories";
import { useApp } from "@/context/AppContext";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
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
  } = useApp();
  const [refreshing, setRefreshing] = React.useState(false);

  const balance = getBalance();
  const income = getMonthlyIncome();
  const expenses = getMonthlyExpenses();
  const savings = income - expenses;
  const savingsRate = income > 0 ? ((savings / income) * 100).toFixed(0) : "0";
  const recentTx = transactions.slice(0, 5);
  const topPadding = Platform.OS === "web" ? 67 : insets.top + 16;

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const alertBudgets = budgets.filter(
    (b) => b.spent / b.limit >= 0.8 && b.limit > 0
  );
  const nearGoal = goals.find(
    (g) =>
      g.currentAmount / g.targetAmount >= 0.9 &&
      g.currentAmount < g.targetAmount
  );

  const categorySpending = getCategorySpending();
  const topCategory = Object.entries(categorySpending).sort(
    ([, a], [, b]) => b - a
  )[0];

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
            <Text style={styles.userName}>{profile.name.split(" ")[0]}</Text>
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

        {/* Level + streak */}
        <Animated.View entering={FadeInDown.delay(80).duration(500)} style={styles.levelRow}>
          <View style={styles.levelBadge}>
            <Feather name="zap" size={12} color={COLORS.accent} />
            <Text style={styles.levelText}>Level {profile.level} · {profile.xp} XP</Text>
          </View>
          <View style={styles.streakBadge}>
            <Feather name="calendar" size={12} color={COLORS.success} />
            <Text style={styles.streakText}>{profile.streak} day streak</Text>
          </View>
        </Animated.View>

        {/* Balance Card */}
        <Animated.View entering={FadeInUp.delay(120).duration(600)} style={{ marginBottom: 20 }}>
          <BalanceCard balance={balance} income={income} expenses={expenses} />
        </Animated.View>

        {/* Monthly Insights Row */}
        {income > 0 || expenses > 0 ? (
          <Animated.View entering={FadeInDown.delay(160).duration(500)} style={styles.insightRow}>
            <InsightCard
              icon="pie-chart"
              label="Savings Rate"
              value={`${savingsRate}%`}
              color={parseFloat(savingsRate) >= 20 ? COLORS.success : COLORS.accentOrange}
              sub={parseFloat(savingsRate) >= 20 ? "Healthy" : "Improve"}
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
              sub={`${goals.filter(g => g.currentAmount >= g.targetAmount).length} done`}
            />
          </Animated.View>
        ) : null}

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.quickActions}>
          <QuickAction icon="plus" label="Add" color={COLORS.success} onPress={() => router.push("/add-transaction")} />
          <QuickAction icon="bar-chart-2" label="Analytics" color={COLORS.primaryLight} onPress={() => router.push("/(tabs)/analytics")} />
          <QuickAction icon="target" label="Goals" color={COLORS.accent} onPress={() => router.push("/(tabs)/goals")} />
          <QuickAction icon="cpu" label="AI Tips" color="#A78BFA" onPress={() => router.push("/ai-chat")} />
          <QuickAction icon="shield" label="Budget" color={COLORS.accentOrange} onPress={() => router.push("/budget-setup")} />
        </Animated.View>

        {/* Alerts */}
        {(alertBudgets.length > 0 || nearGoal) && (
          <Animated.View entering={FadeInDown.delay(240).duration(500)} style={styles.section}>
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
        <Animated.View entering={FadeInDown.delay(280).duration(500)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/analytics")}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentTx.length === 0 ? (
            <View style={styles.emptyBox}>
              <LinearGradient
                colors={["#0D47A1", "#1565C0"]}
                style={styles.emptyIcon}
              >
                <Feather name="plus-circle" size={28} color={COLORS.white} />
              </LinearGradient>
              <Text style={styles.emptyTitle}>No transactions yet</Text>
              <Text style={styles.emptySubtitle}>
                Start tracking your income and expenses to see insights here.
              </Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => router.push("/add-transaction")}
              >
                <Text style={styles.emptyBtnText}>Add First Transaction</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.txList}>
              {recentTx.map((t) => (
                <TransactionItem
                  key={t.id}
                  transaction={t}
                  onPress={() =>
                    router.push({
                      pathname: "/transaction-detail",
                      params: { id: t.id },
                    })
                  }
                />
              ))}
            </View>
          )}
        </Animated.View>

        {/* Financial Health Card */}
        {transactions.length > 0 && (
          <Animated.View entering={FadeInDown.delay(320).duration(500)} style={styles.section}>
            <Text style={styles.sectionTitle}>Financial Health</Text>
            <LinearGradient
              colors={["#0D1B4B", "#1565C0"]}
              style={styles.healthCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.healthRow}>
                <HealthItem
                  label="Balance"
                  value={balance >= 0 ? "Good" : "Negative"}
                  ok={balance >= 0}
                />
                <HealthItem
                  label="Savings"
                  value={parseFloat(savingsRate) >= 20 ? "Healthy" : "Low"}
                  ok={parseFloat(savingsRate) >= 20}
                />
                <HealthItem
                  label="Tracking"
                  value={transactions.length >= 5 ? "Active" : "Start"}
                  ok={transactions.length >= 5}
                />
                <HealthItem
                  label="Goals"
                  value={goals.length > 0 ? "Set" : "None"}
                  ok={goals.length > 0}
                />
              </View>
              <TouchableOpacity
                style={styles.healthBtn}
                onPress={() => router.push("/ai-chat")}
              >
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
    </GradientBackground>
  );
}

function InsightCard({
  icon,
  label,
  value,
  color,
  sub,
}: {
  icon: string;
  label: string;
  value: string;
  color: string;
  sub: string;
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
  icon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
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

function QuickAction({
  icon,
  label,
  color,
  onPress,
}: {
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.qaItem} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.qaIcon, { backgroundColor: color + "22" }]}>
        <Feather name={icon as any} size={20} color={color} />
      </View>
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
  levelRow: { flexDirection: "row", paddingHorizontal: 20, gap: 10, marginBottom: 16 },
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
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: COLORS.success + "18",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.success + "33",
  },
  streakText: { color: COLORS.success, fontSize: 12, fontFamily: "Inter_600SemiBold" },
  insightRow: { flexDirection: "row", paddingHorizontal: 16, gap: 10, marginBottom: 20 },
  quickActions: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 24, flexWrap: "nowrap" },
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
});
