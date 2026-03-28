import { Feather } from "@expo/vector-icons";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedProps, useSharedValue, withTiming } from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import COLORS from "@/constants/colors";
import { CATEGORY_CONFIG } from "@/constants/categories";
import { Budget } from "@/context/AppContext";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface RingProps {
  budget: Budget;
  index: number;
}

const RING_COLORS = ["#1565C0", "#00897B", "#F57C00", "#6A1B9A", "#C62828", "#00838F"];

function BudgetRing({ budget, index }: RingProps) {
  const ratio = Math.min(budget.spent / budget.limit, 1);
  const color = ratio >= 1 ? "#EF5350" : ratio >= 0.8 ? "#FFA726" : RING_COLORS[index % RING_COLORS.length];
  const R = 26, STROKE = 5;
  const circumference = 2 * Math.PI * R;
  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withTiming(ratio, { duration: 1000 });
  }, [ratio]);

  const animProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const cfg = CATEGORY_CONFIG[budget.category];
  const pct = Math.round(ratio * 100);

  return (
    <View style={styles.ringWrapper}>
      <View style={styles.ringSvgContainer}>
        <Svg width={64} height={64}>
          <Circle
            cx={32} cy={32} r={R}
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={STROKE}
            fill="none"
          />
          <AnimatedCircle
            cx={32} cy={32} r={R}
            stroke={color}
            strokeWidth={STROKE}
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            animatedProps={animProps}
            strokeLinecap="round"
            rotation="-90"
            origin="32,32"
          />
        </Svg>
        <View style={styles.ringCenter}>
          <Text style={styles.ringPct}>{pct}%</Text>
        </View>
      </View>
      <Text style={styles.ringIcon}>{cfg?.icon ?? "💼"}</Text>
      <Text style={styles.ringLabel} numberOfLines={1}>{cfg?.label ?? budget.category}</Text>
      <Text style={[styles.ringStatus, { color }]}>
        {ratio >= 1 ? "Over!" : ratio >= 0.8 ? "Alert" : "OK"}
      </Text>
    </View>
  );
}

interface Props {
  budgets: Budget[];
}

export function BudgetRingsRow({ budgets }: Props) {
  const activeBudgets = budgets.filter((b) => b.limit > 0);
  if (!activeBudgets.length) return null;

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Feather name="pie-chart" size={14} color={COLORS.primaryLight} />
          <Text style={styles.title}>Budget Rings</Text>
        </View>
        <Text style={styles.subtitle}>{activeBudgets.length} active</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {activeBudgets.map((b, i) => (
          <BudgetRing key={b.category} budget={b} index={i} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: "rgba(13,27,75,0.6)",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: { color: COLORS.white, fontWeight: "700", fontSize: 14 },
  subtitle: { color: COLORS.darkTextSecondary, fontSize: 12 },
  scroll: { gap: 16, paddingRight: 8 },
  ringWrapper: { alignItems: "center", gap: 4, width: 72 },
  ringSvgContainer: { position: "relative", width: 64, height: 64 },
  ringCenter: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  ringPct: { color: COLORS.white, fontSize: 11, fontWeight: "700" },
  ringIcon: { fontSize: 16 },
  ringLabel: { color: COLORS.darkTextSecondary, fontSize: 11, textAlign: "center" },
  ringStatus: { fontSize: 10, fontWeight: "700" },
});
