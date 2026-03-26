import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import COLORS from "@/constants/colors";

interface Props {
  label: string;
  value: string;
  icon: string;
  iconColor?: string;
  trend?: number;
  style?: ViewStyle;
}

export function StatChip({ label, value, icon, iconColor = COLORS.primaryLight, trend, style }: Props) {
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.iconWrap, { backgroundColor: iconColor + "22" }]}>
        <Feather name={icon as any} size={16} color={iconColor} />
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {trend !== undefined && (
        <View style={styles.trend}>
          <Feather
            name={trend >= 0 ? "trending-up" : "trending-down"}
            size={12}
            color={trend >= 0 ? COLORS.success : COLORS.error}
          />
          <Text
            style={[
              styles.trendText,
              { color: trend >= 0 ? COLORS.success : COLORS.error },
            ]}
          >
            {Math.abs(trend)}%
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 18,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    flex: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: COLORS.darkTextSecondary,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  value: {
    color: COLORS.darkText,
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  trend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
});
