import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Alert,
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
import Svg, { Circle, Path } from "react-native-svg";
import { GradientBackground } from "@/components/GradientBackground";
import { TransactionItem } from "@/components/TransactionItem";
import COLORS from "@/constants/colors";
import { CATEGORY_CONFIG, formatAmount } from "@/constants/categories";
import { useApp } from "@/context/AppContext";

const { width: SW } = Dimensions.get("window");
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
type Period = "week" | "month" | "year";
const PIE_COLORS = ["#1565C0","#00897B","#F57C00","#6A1B9A","#C62828","#00838F","#558B2F","#AD1457"];

function getDateRange(period: Period): { from: Date; to: Date } {
  const now = new Date();
  const to = new Date(now);
  const from = new Date(now);
  if (period === "week") {
    from.setDate(from.getDate() - 7);
  } else if (period === "month") {
    from.setMonth(from.getMonth() - 1);
  } else {
    from.setFullYear(from.getFullYear() - 1);
  }
  return { from, to };
}

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { transactions, deleteTransaction } = useApp();
  const [period, setPeriod] = useState<Period>("month");
  const [activeFilter, setActiveFilter] = useState<"all" | "income" | "expense">("all");
  const topPadding = Platform.OS === "web" ? 67 : insets.top + 16;

  const { from, to } = getDateRange(period);

  const periodTx = transactions.filter((t) => {
    const d = new Date(t.date);
    return d >= from && d <= to;
  });

  const income = periodTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expenses = periodTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const savings = income - expenses;
  const savingsRate = income > 0 ? ((savings / income) * 100).toFixed(0) : "0";

  const categorySpending: Record<string, number> = {};
  periodTx.filter((t) => t.type === "expense").forEach((t) => {
    categorySpending[t.category] = (categorySpending[t.category] ?? 0) + t.amount;
  });
  const topCategories = Object.entries(categorySpending).sort(([, a], [, b]) => b - a).slice(0, 6);
  const totalSpent = Object.values(categorySpending).reduce((s, v) => s + v, 0);

  const filteredTx = periodTx.filter((t) => {
    if (activeFilter === "all") return true;
    return t.type === activeFilter;
  });

  const monthlyData = getLast6MonthsData(transactions);

  const handleDelete = (id: string) => {
    Alert.alert("Delete Transaction", "Are you sure you want to delete this transaction?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteTransaction(id) },
    ]);
  };

  return (
    <GradientBackground colors={["#060D1F", "#0A1628", "#0D1B4B"]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={[styles.header, { paddingTop: topPadding }]}>
          <Text style={styles.title}>Analytics</Text>
          <View style={styles.periodPicker}>
            {(["week", "month", "year"] as Period[]).map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.periodBtn, period === p && styles.periodActive]}
                onPress={() => setPeriod(p)}
              >
                <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                  {p === "week" ? "Week" : p === "month" ? "Month" : "Year"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Summary Stats */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.statsRow}>
          <View style={[styles.statCard, { borderColor: COLORS.success + "44" }]}>
            <Feather name="arrow-up-circle" size={16} color={COLORS.success} />
            <Text style={styles.statLabel}>Income</Text>
            <Text style={[styles.statValue, { color: COLORS.success }]}>{formatAmount(income)}</Text>
          </View>
          <View style={[styles.statCard, { borderColor: COLORS.error + "44" }]}>
            <Feather name="arrow-down-circle" size={16} color={COLORS.error} />
            <Text style={styles.statLabel}>Expenses</Text>
            <Text style={[styles.statValue, { color: COLORS.error }]}>{formatAmount(expenses)}</Text>
          </View>
          <View style={[styles.statCard, { borderColor: COLORS.accent + "44" }]}>
            <Feather name="trending-up" size={16} color={COLORS.accent} />
            <Text style={styles.statLabel}>Saved</Text>
            <Text style={[styles.statValue, { color: savings >= 0 ? COLORS.accent : COLORS.error }]}>
              {savingsRate}%
            </Text>
          </View>
        </Animated.View>

        {/* Pie Chart — native SVG, no crash */}
        {topCategories.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(140).duration(400)} style={styles.section}>
            <Text style={styles.sectionTitle}>Spending by Category</Text>
            <View style={styles.chartCard}>
              <PieChart categories={topCategories} total={totalSpent} />
            </View>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.delay(140).duration(400)} style={styles.section}>
            <Text style={styles.sectionTitle}>Spending by Category</Text>
            <View style={styles.emptyChart}>
              <Feather name="pie-chart" size={36} color={COLORS.darkBorder} />
              <Text style={styles.emptyChartText}>No expense data for this period</Text>
            </View>
          </Animated.View>
        )}

        {/* Bar Chart */}
        <Animated.View entering={FadeInDown.delay(180).duration(400)} style={styles.section}>
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
          <Animated.View entering={FadeInDown.delay(220).duration(400)} style={styles.section}>
            <Text style={styles.sectionTitle}>Spending Breakdown</Text>
            <View style={styles.card}>
              {topCategories.map(([cat, amount], idx) => {
                const config = CATEGORY_CONFIG[cat as any];
                if (!config) return null;
                const pct = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
                const color = PIE_COLORS[idx % PIE_COLORS.length];
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
                        <View style={[styles.progressFill, { width: `${Math.min(pct, 100)}%` as any, backgroundColor: color }]} />
                      </View>
                      <Text style={styles.catPct}>{pct.toFixed(0)}% of total</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* Transaction List with delete */}
        <Animated.View entering={FadeInDown.delay(260).duration(400)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transactions</Text>
            <Text style={styles.txCount}>{filteredTx.length} total</Text>
          </View>
          <View style={styles.filterRow}>
            {(["all", "income", "expense"] as const).map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterBtn, activeFilter === f && styles.filterActive]}
                onPress={() => setActiveFilter(f)}
              >
                <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {filteredTx.length === 0 ? (
            <View style={styles.empty}>
              <Feather name="inbox" size={28} color={COLORS.darkTextSecondary} />
              <Text style={styles.emptyText}>No transactions in this period</Text>
              <Text style={styles.emptySubText}>Try switching to Week, Month, or Year above</Text>
            </View>
          ) : (
            <View style={styles.txList}>
              {filteredTx.map((t) => (
                <TransactionItem
                  key={t.id}
                  transaction={t}
                  onPress={() => handleDelete(t.id)}
                />
              ))}
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </GradientBackground>
  );
}

function PieChart({ categories, total }: { categories: [string, number][]; total: number }) {
  const SIZE = Math.min(SW - 80, 200);
  const R = SIZE / 2;
  const INNER_R = R * 0.52;
  const GAP = 0.025;
  let cumAngle = -Math.PI / 2;

  const slices = categories.map(([cat, amount], idx) => {
    const pct = amount / total;
    const angle = pct * Math.PI * 2 - GAP;
    const startAngle = cumAngle + GAP / 2;
    cumAngle += pct * Math.PI * 2;
    const x1 = R + R * Math.cos(startAngle);
    const y1 = R + R * Math.sin(startAngle);
    const x2 = R + R * Math.cos(startAngle + angle);
    const y2 = R + R * Math.sin(startAngle + angle);
    const ix1 = R + INNER_R * Math.cos(startAngle + angle);
    const iy1 = R + INNER_R * Math.sin(startAngle + angle);
    const ix2 = R + INNER_R * Math.cos(startAngle);
    const iy2 = R + INNER_R * Math.sin(startAngle);
    const large = angle > Math.PI ? 1 : 0;
    const color = PIE_COLORS[idx % PIE_COLORS.length];
    const config = CATEGORY_CONFIG[cat as any];
    return { d: `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${INNER_R} ${INNER_R} 0 ${large} 0 ${ix2} ${iy2} Z`, color, config, pct, amount };
  });

  return (
    <View style={pieStyles.container}>
      <View style={pieStyles.chartWrap}>
        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          {slices.map((s, i) => (
            <Path key={i} d={s.d} fill={s.color} opacity={0.92} />
          ))}
          <Circle cx={R} cy={R} r={INNER_R - 2} fill="#0A1628" />
        </Svg>
        <View style={[pieStyles.center, { width: INNER_R * 2 - 8, height: INNER_R * 2 - 8 }]}>
          <Text style={pieStyles.centerAmt}>{formatAmount(total)}</Text>
          <Text style={pieStyles.centerLabel}>Spent</Text>
        </View>
      </View>
      <View style={pieStyles.legend}>
        {slices.map((s, i) => (
          <View key={i} style={pieStyles.legendRow}>
            <View style={[pieStyles.legendDot, { backgroundColor: s.color }]} />
            <Text style={pieStyles.legendText} numberOfLines={1}>{s.config?.label ?? categories[i][0]}</Text>
            <Text style={pieStyles.legendPct}>{(s.pct * 100).toFixed(0)}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const pieStyles = StyleSheet.create({
  container: { gap: 18 },
  chartWrap: { alignItems: "center", justifyContent: "center", position: "relative" },
  center: { position: "absolute", alignItems: "center", justifyContent: "center", borderRadius: 999 },
  centerAmt: { color: COLORS.white, fontSize: 13, fontFamily: "Inter_700Bold", textAlign: "center" },
  centerLabel: { color: COLORS.darkTextSecondary, fontSize: 11, fontFamily: "Inter_400Regular" },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 10, rowGap: 8 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 6, width: "47%" },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: COLORS.darkText, fontSize: 12, fontFamily: "Inter_500Medium", flex: 1 },
  legendPct: { color: COLORS.darkTextSecondary, fontSize: 11, fontFamily: "Inter_600SemiBold" },
});

function getLast6MonthsData(transactions: any[]) {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const income = transactions
      .filter((t) => { const td = new Date(t.date); return t.type === "income" && td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear(); })
      .reduce((s, t) => s + t.amount, 0);
    const expense = transactions
      .filter((t) => { const td = new Date(t.date); return t.type === "expense" && td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear(); })
      .reduce((s, t) => s + t.amount, 0);
    return { month: MONTHS[d.getMonth()], income, expense };
  });
}

function BarChart({ data }: { data: { month: string; income: number; expense: number }[] }) {
  const max = Math.max(...data.flatMap((d) => [d.income, d.expense]), 1);
  const BAR_H = 100;
  return (
    <View style={bcStyles.container}>
      {data.map((d, i) => (
        <View key={i} style={bcStyles.group}>
          <View style={[bcStyles.barGroup, { height: BAR_H }]}>
            <View style={[bcStyles.bar, { height: Math.max((d.income / max) * BAR_H, 4), backgroundColor: COLORS.success }]} />
            <View style={[bcStyles.bar, { height: Math.max((d.expense / max) * BAR_H, 4), backgroundColor: COLORS.error }]} />
          </View>
          <Text style={bcStyles.label}>{d.month}</Text>
        </View>
      ))}
    </View>
  );
}

const bcStyles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", paddingHorizontal: 4 },
  group: { alignItems: "center", gap: 8, flex: 1 },
  barGroup: { flexDirection: "row", alignItems: "flex-end", gap: 3, justifyContent: "center" },
  bar: { width: 10, borderRadius: 4 },
  label: { color: COLORS.darkTextSecondary, fontSize: 11, fontFamily: "Inter_400Regular" },
});

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, marginBottom: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: COLORS.white, fontSize: 28, fontFamily: "Inter_700Bold" },
  periodPicker: { flexDirection: "row", backgroundColor: COLORS.darkCard, borderRadius: 12, padding: 3, gap: 2, borderWidth: 1, borderColor: COLORS.darkBorder },
  periodBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  periodActive: { backgroundColor: COLORS.primary },
  periodText: { color: COLORS.darkTextSecondary, fontSize: 12, fontFamily: "Inter_500Medium" },
  periodTextActive: { color: COLORS.white },
  statsRow: { flexDirection: "row", paddingHorizontal: 16, gap: 10, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: COLORS.darkCard, borderRadius: 16, padding: 12, gap: 4, borderWidth: 1, borderColor: COLORS.darkBorder, alignItems: "center" },
  statLabel: { color: COLORS.darkTextSecondary, fontSize: 11, fontFamily: "Inter_400Regular" },
  statValue: { fontSize: 13, fontFamily: "Inter_700Bold" },
  section: { marginBottom: 24, paddingHorizontal: 16 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  sectionTitle: { color: COLORS.white, fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 14 },
  txCount: { color: COLORS.darkTextSecondary, fontSize: 13 },
  filterRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: COLORS.darkCard, borderWidth: 1, borderColor: COLORS.darkBorder },
  filterActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primaryLight },
  filterText: { color: COLORS.darkTextSecondary, fontSize: 13, fontFamily: "Inter_500Medium" },
  filterTextActive: { color: COLORS.white },
  card: { backgroundColor: COLORS.darkCard, borderRadius: 20, padding: 16, gap: 16, borderWidth: 1, borderColor: COLORS.darkBorder },
  chartCard: { backgroundColor: COLORS.darkCard, borderRadius: 20, padding: 16, gap: 16, borderWidth: 1, borderColor: COLORS.darkBorder },
  chartLegend: { flexDirection: "row", gap: 16 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: COLORS.darkTextSecondary, fontSize: 12, fontFamily: "Inter_400Regular" },
  catRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  catIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  catInfo: { flex: 1, gap: 6 },
  catTop: { flexDirection: "row", justifyContent: "space-between" },
  catLabel: { color: COLORS.darkText, fontSize: 14, fontFamily: "Inter_500Medium" },
  catAmount: { color: COLORS.darkText, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  progressTrack: { height: 6, backgroundColor: COLORS.darkBorder, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 6, borderRadius: 3, minWidth: 4 },
  catPct: { color: COLORS.darkTextSecondary, fontSize: 11, fontFamily: "Inter_400Regular" },
  txList: { backgroundColor: COLORS.darkCard, borderRadius: 20, borderWidth: 1, borderColor: COLORS.darkBorder, overflow: "hidden" },
  empty: { alignItems: "center", paddingVertical: 40, gap: 10, backgroundColor: COLORS.darkCard, borderRadius: 20, borderWidth: 1, borderColor: COLORS.darkBorder },
  emptyText: { color: COLORS.darkTextSecondary, fontSize: 15, fontFamily: "Inter_500Medium" },
  emptySubText: { color: COLORS.darkBorder, fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", paddingHorizontal: 24 },
  emptyChart: { alignItems: "center", paddingVertical: 32, gap: 10, backgroundColor: COLORS.darkCard, borderRadius: 20, borderWidth: 1, borderColor: COLORS.darkBorder },
  emptyChartText: { color: COLORS.darkTextSecondary, fontSize: 14, fontFamily: "Inter_400Regular" },
});
