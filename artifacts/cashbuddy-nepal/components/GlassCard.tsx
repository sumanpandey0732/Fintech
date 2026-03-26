import { BlurView } from "expo-blur";
import React from "react";
import { Platform, StyleSheet, View, ViewStyle } from "react-native";
import COLORS from "@/constants/colors";

interface Props {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  intensity?: number;
  variant?: "dark" | "light" | "medium";
}

export function GlassCard({ children, style, intensity = 30, variant = "dark" }: Props) {
  const bgColor =
    variant === "dark"
      ? COLORS.glassWhite
      : variant === "medium"
      ? COLORS.glassWhiteMedium
      : "rgba(255,255,255,0.08)";

  if (Platform.OS === "web") {
    return (
      <View
        style={[
          styles.base,
          {
            backgroundColor: variant === "dark" ? COLORS.darkCard : COLORS.glassWhite,
            borderColor: COLORS.glassBorder,
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <View style={[styles.base, { borderColor: COLORS.glassBorder }, style]}>
      <BlurView
        intensity={intensity}
        tint="dark"
        style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: bgColor, borderRadius: 20 },
        ]}
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  content: {
    flex: 1,
  },
});
