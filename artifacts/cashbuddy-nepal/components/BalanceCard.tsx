import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import COLORS from "@/constants/colors";
import { formatAmount } from "@/constants/categories";

interface Props {
  balance: number;
  income: number;
  expenses: number;
  currency?: string;
}

function AnimatedNumber({ value, style }: { value: number; style?: any }) {
  const animValue = useSharedValue(0);

  useEffect(() => {
    animValue.value = withTiming(value, { duration: 800 });
  }, [value]);

  return (
    <Text style={style}>
      {formatAmount(Math.floor(value))}
    </Text>
  );
}

export function BalanceCard({ balance, income, expenses, currency = "Rs." }: Props) {
  return (
    <LinearGradient
      colors={["#0D47A1", "#1565C0", "#1976D2"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />

      <View style={styles.header}>
        <Text style={styles.label}>Total Balance</Text>
        <View style={styles.badge}>
          <Feather name="trending-up" size={12} color={COLORS.accent} />
          <Text style={styles.badgeText}>2.4%</Text>
        </View>
      </View>

      <AnimatedNumber value={balance} style={styles.balance} />

      <View style={styles.divider} />

      <View style={styles.row}>
        <View style={styles.stat}>
          <View style={styles.statLabel}>
            <View style={[styles.dot, { backgroundColor: COLORS.success }]} />
            <Text style={styles.statText}>Income</Text>
          </View>
          <Text style={[styles.statAmount, { color: COLORS.success }]}>
            {formatAmount(income, currency)}
          </Text>
        </View>

        <View style={styles.verticalDivider} />

        <View style={styles.stat}>
          <View style={styles.statLabel}>
            <View style={[styles.dot, { backgroundColor: COLORS.error }]} />
            <Text style={styles.statText}>Expenses</Text>
          </View>
          <Text style={[styles.statAmount, { color: COLORS.error }]}>
            {formatAmount(expenses, currency)}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 16,
    overflow: "hidden",
    shadowColor: "#1565C0",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  decorCircle1: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.06)",
    top: -40,
    right: -40,
  },
  decorCircle2: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.04)",
    bottom: 20,
    left: -20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  label: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,215,0,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  badgeText: {
    color: COLORS.accent,
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  balance: {
    color: COLORS.white,
    fontSize: 36,
    fontFamily: "Inter_700Bold",
    letterSpacing: -1,
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  stat: {
    flex: 1,
    gap: 6,
  },
  statLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  statAmount: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  verticalDivider: {
    width: 1,
    height: 36,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginHorizontal: 16,
  },
});
