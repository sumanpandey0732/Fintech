import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useRef } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BalanceCard } from "@/components/BalanceCard";
import { GradientBackground } from "@/components/GradientBackground";
import { TransactionItem } from "@/components/TransactionItem";
import COLORS from "@/constants/colors";
import { CATEGORY_CONFIG, formatAmount } from "@/constants/categories";
import { useApp } from "@/context/AppContext";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { transactions, profile, getBalance, getMonthlyIncome, getMonthlyExpenses, budgets, goals } = useApp();
  const [refreshing, setRefreshing] = React.useState(false);

  const balance = getBalance();
  const income = getMonthlyIncome();
  const expenses = getMonthlyExpenses();
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
    (g) => g.currentAmount / g.targetAmount >= 0.9 && g.currentAmount < g.targetAmount
  );

  return (
    <GradientBackground colors={["#060D1F", "#0A1628", "#0D1B4B"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 120 : 120 }}
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
            <Text style={styles.greeting}>Good morning,</Text>
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
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Feather name="bell" size={20} color={COLORS.accent} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Level Badge */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.levelRow}>
          <View style={styles.levelBadge}>
            <Feather name="zap" size={12} color={COLORS.accent} />
            <Text style={styles.levelText}>
              Level {profile.level} • {profile.xp} XP
            </Text>
          </View>
          <View style={styles.streakBadge}>
            <Feather name="calendar" size={12} color={COLORS.success} />
            <Text style={styles.streakText}>{profile.streak} day streak</Text>
          </View>
        </Animated.View>

        {/* Balance Card */}
        <Animated.View entering={FadeInUp.delay(150).duration(600)} style={styles.balanceSection}>
          <BalanceCard balance={balance} income={income} expenses={expenses} />
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.quickActions}>
          <QuickAction
            icon="plus"
            label="Add"
            color={COLORS.success}
            onPress={() => router.push("/add-transaction")}
          />
          <QuickAction
            icon="trending-up"
            label="Analytics"
            color={COLORS.primaryLight}
            onPress={() => router.push("/(tabs)/analytics")}
          />
          <QuickAction
            icon="target"
            label="Goals"
            color={COLORS.accent}
            onPress={() => router.push("/(tabs)/goals")}
          />
          <QuickAction
            icon="message-circle"
            label="AI Tips"
            color="#A78BFA"
            onPress={() => router.push("/ai-chat")}
          />
        </Animated.View>

        {/* Alerts */}
        {(alertBudgets.length > 0 || nearGoal) && (
          <Animated.View entering={FadeInDown.delay(250).duration(500)} style={styles.section}>
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
        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/analytics")}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentTx.length === 0 ? (
            <View style={styles.empty}>
              <Feather name="inbox" size={32} color={COLORS.darkTextSecondary} />
              <Text style={styles.emptyText}>No transactions yet</Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => router.push("/add-transaction")}
              >
                <Text style={styles.emptyBtnText}>Add your first one</Text>
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
  greeting: {
    color: COLORS.darkTextSecondary,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  userName: {
    color: COLORS.white,
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    gap: 10,
  },
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
  levelRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 16,
  },
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
  levelText: {
    color: COLORS.accent,
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
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
  streakText: {
    color: COLORS.success,
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  balanceSection: {
    marginBottom: 20,
  },
  quickActions: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 24,
  },
  qaItem: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  qaIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  qaLabel: {
    color: COLORS.darkTextSecondary,
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  seeAll: {
    color: COLORS.primaryLight,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  txList: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    overflow: "hidden",
  },
  empty: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 12,
    backgroundColor: COLORS.darkCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  emptyText: {
    color: COLORS.darkTextSecondary,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  emptyBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
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
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  alertText: {
    color: COLORS.darkText,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  alertSub: {
    color: COLORS.darkTextSecondary,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
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
