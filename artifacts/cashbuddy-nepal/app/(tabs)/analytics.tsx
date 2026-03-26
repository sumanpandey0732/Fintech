import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GradientBackground } from "@/components/GradientBackground";
import { TransactionItem } from "@/components/TransactionItem";
import COLORS from "@/constants/colors";
import { CATEGORY_CONFIG, formatAmount } from "@/constants/categories";
import { useApp } from "@/context/AppContext";

const { width: SW } = Dimensions.get("window");

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type Period = "week" | "month" | "year";

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { transactions, getMonthlyIncome, getMonthlyExpenses, getCategorySpending } = useApp();
  const [period, setPeriod] = useState<Period>("month");
  const [activeFilter, setActiveFilter] = useState<"all" | "income" | "expense">("all");

  const topPadding = Platform.OS === "web" ? 67 : insets.top + 16;

  const income = getMonthlyIncome();
  const expenses = getMonthlyExpenses();
  const savings = income - expenses;
  const savingsRate = income > 0 ? ((savings / income) * 100).toFixed(0) : "0";

  const categorySpending = getCategorySpending();
  const topCategories = Object.entries(categorySpending)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
  const totalSpent = Object.values(categorySpending).reduce((s, v) => s + v, 0);

  const filteredTx = transactions.filter((t) => {
    if (activeFilter === "all") return true;
    return t.type === activeFilter;
  });

  const monthlyData = getLast6MonthsData(transactions);

  return (
    <GradientBackground colors={["#060D1F", "#0A1628", "#0D1B4B"]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 120 : 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={[styles.header, { paddingTop: topPadding }]}
        >
          <Text style={styles.title}>Analytics</Text>
          <View style={styles.periodPicker}>
            {(["week", "month", "year"] as Period[]).map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.periodBtn, period === p && styles.periodActive]}
                onPress={() => setPeriod(p)}
              >
                <Text
                  style={[
                    styles.periodText,
                    period === p && styles.periodTextActive,
                  ]}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Summary Stats */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Income</Text>
            <Text style={[styles.statValue, { color: COLORS.success }]}>
              {formatAmount(income)}
            </Text>
            <View style={styles.trendRow}>
              <Feather name="trending-up" size={12} color={COLORS.success} />
              <Text style={[styles.trendTxt, { color: COLORS.success }]}>+12%</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Expenses</Text>
            <Text style={[styles.statValue, { color: COLORS.error }]}>
              {formatAmount(expenses)}
            </Text>
            <View style={styles.trendRow}>
              <Feather name="trending-down" size={12} color={COLORS.error} />
              <Text style={[styles.trendTxt, { color: COLORS.error }]}>-5%</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Savings</Text>
            <Text
              style={[
                styles.statValue,
                { color: savings >= 0 ? COLORS.accent : COLORS.error },
              ]}
            >
              {savingsRate}%
            </Text>
            <Text style={styles.trendTxt}>of income</Text>
          </View>
        </Animated.View>

        {/* Bar Chart */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>6-Month Overview</Text>
          <View style={styles.chartCard}>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
                <Text style={styles.legendText}>Income</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.error }]} />
                <Text style={styles.legendText}>Expense</Text>
              </View>
            </View>
            <BarChart data={monthlyData} />
          </View>
        </Animated.View>

        {/* Category Breakdown */}
        {topCategories.length > 0 && (
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
            <Text style={styles.sectionTitle}>Spending Breakdown</Text>
            <View style={styles.card}>
              {topCategories.map(([cat, amount]) => {
                const config = CATEGORY_CONFIG[cat as any];
                if (!config) return null;
                const pct = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
                return (
                  <View key={cat} style={styles.catRow}>
                    <View style={[styles.catIcon, { backgroundColor: config.color + "22" }]}>
                      <Feather name={config.icon as any} size={16} color={config.color} />
                    </View>
                    <View style={styles.catInfo}>
                      <View style={styles.catTop}>
                        <Text style={styles.catLabel}>{config.label}</Text>
                        <Text style={styles.catAmount}>{formatAmount(amount)}</Text>
                      </View>
                      <View style={styles.progressTrack}>
                        <LinearGradient
                          colors={[config.color + "AA", config.color]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={[styles.progressFill, { width: `${Math.min(pct, 100)}%` }]}
                        />
                      </View>
                      <Text style={styles.catPct}>{pct.toFixed(0)}% of total</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* Transaction List */}
        <Animated.View entering={FadeInDown.delay(250).duration(400)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transactions</Text>
            <View style={styles.filterRow}>
              {(["all", "income", "expense"] as const).map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[styles.filterBtn, activeFilter === f && styles.filterActive]}
                  onPress={() => setActiveFilter(f)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      activeFilter === f && styles.filterTextActive,
                    ]}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {filteredTx.length === 0 ? (
            <View style={styles.empty}>
              <Feather name="inbox" size={28} color={COLORS.darkTextSecondary} />
              <Text style={styles.emptyText}>No transactions</Text>
            </View>
          ) : (
            <View style={styles.txList}>
              {filteredTx.slice(0, 20).map((t) => (
                <TransactionItem key={t.id} transaction={t} />
              ))}
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </GradientBackground>
  );
}

function getLast6MonthsData(transactions: any[]) {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const income = transactions
      .filter((t) => {
        const td = new Date(t.date);
        return t.type === "income" && td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
      })
      .reduce((s, t) => s + t.amount, 0);
    const expense = transactions
      .filter((t) => {
        const td = new Date(t.date);
        return t.type === "expense" && td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
      })
      .reduce((s, t) => s + t.amount, 0);
    return {
      month: MONTHS[d.getMonth()],
      income,
      expense,
    };
  });
}

function BarChart({ data }: { data: { month: string; income: number; expense: number }[] }) {
  const max = Math.max(...data.flatMap((d) => [d.income, d.expense]), 1);
  const BAR_HEIGHT = 120;

  return (
    <View style={bcStyles.container}>
      {data.map((d, i) => (
        <View key={i} style={bcStyles.group}>
          <View style={[bcStyles.barGroup, { height: BAR_HEIGHT }]}>
            <View
              style={[
                bcStyles.bar,
                {
                  height: Math.max((d.income / max) * BAR_HEIGHT, 4),
                  backgroundColor: COLORS.success,
                },
              ]}
            />
            <View
              style={[
                bcStyles.bar,
                {
                  height: Math.max((d.expense / max) * BAR_HEIGHT, 4),
                  backgroundColor: COLORS.error,
                },
              ]}
            />
          </View>
          <Text style={bcStyles.label}>{d.month}</Text>
        </View>
      ))}
    </View>
  );
}

const bcStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  group: {
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  barGroup: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 3,
    justifyContent: "center",
  },
  bar: {
    width: 10,
    borderRadius: 4,
  },
  label: {
    color: COLORS.darkTextSecondary,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
});

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    color: COLORS.white,
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  periodPicker: {
    flexDirection: "row",
    backgroundColor: COLORS.darkCard,
    borderRadius: 12,
    padding: 3,
    gap: 2,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  periodBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  periodActive: {
    backgroundColor: COLORS.primary,
  },
  periodText: {
    color: COLORS.darkTextSecondary,
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  periodTextActive: {
    color: COLORS.white,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.darkCard,
    borderRadius: 16,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  statLabel: {
    color: COLORS.darkTextSecondary,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  statValue: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  trendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  trendTxt: {
    color: COLORS.darkTextSecondary,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    marginBottom: 14,
    gap: 12,
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginBottom: 14,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.darkCard,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  filterActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryLight,
  },
  filterText: {
    color: COLORS.darkTextSecondary,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  filterTextActive: {
    color: COLORS.white,
  },
  card: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 20,
    padding: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  chartCard: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 20,
    padding: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  chartLegend: {
    flexDirection: "row",
    gap: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: COLORS.darkTextSecondary,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  catRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  catIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  catInfo: {
    flex: 1,
    gap: 6,
  },
  catTop: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  catLabel: {
    color: COLORS.darkText,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  catAmount: {
    color: COLORS.darkText,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  progressTrack: {
    height: 6,
    backgroundColor: COLORS.darkBorder,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
    minWidth: 4,
  },
  catPct: {
    color: COLORS.darkTextSecondary,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
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
});
