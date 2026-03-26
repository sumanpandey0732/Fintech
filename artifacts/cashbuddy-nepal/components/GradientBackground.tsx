import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import COLORS from "@/constants/colors";

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  colors?: readonly [string, string, ...string[]];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
}

export function GradientBackground({
  children,
  style,
  colors = [COLORS.gradientStart, COLORS.gradientMid, COLORS.gradientEnd],
  start = { x: 0.1, y: 0 },
  end = { x: 0.9, y: 1 },
}: Props) {
  return (
    <LinearGradient colors={colors} start={start} end={end} style={[styles.bg, style]}>
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
});
