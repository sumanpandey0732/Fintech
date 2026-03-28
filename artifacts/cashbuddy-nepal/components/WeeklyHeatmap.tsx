import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import COLORS from "@/constants/colors";

interface DayData {
  label: string;
  amount: number;
}

interface Props {
  data: DayData[];
  maxAmount: number;
}

const DAY_COLORS = [
  ["#1A237E", "#283593"],
  ["#1565C0", "#1976D2"],
  ["#0277BD", "#0288D1"],
  ["#00838F", "#00ACC1"],
  ["#00897B", "#26A69A"],
];

function getColorForRatio(ratio: number): [string, string] {
  if (ratio === 0) return ["#0D1B4B", "#0D1B4B"];
  const idx = Math.min(Math.floor(ratio * DAY_COLORS.length), DAY_COLORS.length - 1);
  return DAY_COLORS[idx] as [string, string];
}

export function WeeklyHeatmap({ data, maxAmount }: Props) {
  const today = new Date().getDay();

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Feather name="activity" size={14} color={COLORS.primaryLight} />
          <Text style={styles.title}>7-Day Spending Heatmap</Text>
        </View>
        <Text style={styles.subtitle}>
          Total: Rs. {data.reduce((s, d) => s + d.amount, 0).toLocaleString("en-NP")}
        </Text>
      </View>

      <View style={styles.barsRow}>
        {data.map((day, i) => {
          const ratio = maxAmount > 0 ? day.amount / maxAmount : 0;
          const barH = Math.max(ratio * 70, 4);
          const isToday = i === (today === 0 ? 6 : today - 1);
          const [c1, c2] = getColorForRatio(ratio);

          return (
            <View key={i} style={styles.barCol}>
              {day.amount > 0 && (
                <Text style={styles.amtLabel}>
                  {day.amount >= 1000
                    ? `${(day.amount / 1000).toFixed(1)}k`
                    : day.amount}
                </Text>
              )}
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: barH,
                      backgroundColor: ratio > 0 ? c1 : "#1A2A5A",
                      borderColor: isToday ? COLORS.accent : "transparent",
                      borderWidth: isToday ? 1.5 : 0,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.dayLabel, isToday && styles.todayLabel]}>
                {day.label}
              </Text>
              {isToday && <View style={styles.todayDot} />}
            </View>
          );
        })}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#0D1B4B" }]} />
          <Text style={styles.legendText}>No spend</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#1565C0" }]} />
          <Text style={styles.legendText}>Low</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#00ACC1" }]} />
          <Text style={styles.legendText}>Medium</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#26A69A" }]} />
          <Text style={styles.legendText}>High</Text>
        </View>
      </View>
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
    marginBottom: 16,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: { color: COLORS.white, fontWeight: "700", fontSize: 14 },
  subtitle: { color: COLORS.darkTextSecondary, fontSize: 12 },
  barsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 100,
    gap: 6,
  },
  barCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
  },
  amtLabel: {
    color: COLORS.primaryLight,
    fontSize: 9,
    fontWeight: "600",
  },
  barTrack: {
    width: "100%",
    height: 70,
    justifyContent: "flex-end",
  },
  bar: {
    width: "100%",
    borderRadius: 6,
    minHeight: 4,
  },
  dayLabel: {
    color: COLORS.darkTextSecondary,
    fontSize: 11,
    fontWeight: "500",
  },
  todayLabel: { color: COLORS.accent, fontWeight: "700" },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.accent,
  },
  legend: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
    flexWrap: "wrap",
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: COLORS.darkTextSecondary, fontSize: 11 },
});
