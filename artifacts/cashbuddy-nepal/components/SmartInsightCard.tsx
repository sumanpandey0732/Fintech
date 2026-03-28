import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import COLORS from "@/constants/colors";

interface Insight {
  icon: string;
  color: string;
  gradient: [string, string];
  title: string;
  body: string;
}

interface Props {
  insights: Insight[];
  onViewAll?: () => void;
}

export function SmartInsightCard({ insights, onViewAll }: Props) {
  const [idx, setIdx] = useState(0);
  const pulseAnim = useSharedValue(1);

  useEffect(() => {
    pulseAnim.value = withRepeat(
      withSequence(withTiming(1.05, { duration: 1200 }), withTiming(1, { duration: 1200 })),
      -1,
      true
    );
    const timer = setInterval(() => {
      setIdx((i) => (i + 1) % insights.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [insights.length]);

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  if (!insights.length) return null;
  const insight = insights[idx];

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Feather name="zap" size={14} color={COLORS.accent} />
          <Text style={styles.sectionTitle}>Smart Insights</Text>
        </View>
        {onViewAll && (
          <TouchableOpacity onPress={onViewAll}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        )}
      </View>

      <Animated.View key={idx} entering={FadeIn.duration(400)} exiting={FadeOut.duration(200)}>
        <LinearGradient
          colors={insight.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <Animated.View style={[styles.iconCircle, glowStyle, { backgroundColor: insight.color + "33" }]}>
            <Text style={styles.iconText}>{insight.icon}</Text>
          </Animated.View>
          <View style={styles.content}>
            <Text style={styles.insightTitle}>{insight.title}</Text>
            <Text style={styles.insightBody}>{insight.body}</Text>
          </View>
          <View style={styles.dotsRow}>
            {insights.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === idx && styles.dotActive]}
              />
            ))}
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginHorizontal: 20, marginBottom: 16 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  sectionTitle: { color: COLORS.white, fontWeight: "700", fontSize: 15 },
  viewAll: { color: COLORS.primaryLight, fontSize: 13 },
  card: {
    borderRadius: 20,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    minHeight: 90,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: { fontSize: 26 },
  content: { flex: 1 },
  insightTitle: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 4,
  },
  insightBody: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12.5,
    lineHeight: 18,
  },
  dotsRow: {
    position: "absolute",
    bottom: 10,
    right: 14,
    flexDirection: "row",
    gap: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  dotActive: { backgroundColor: COLORS.white, width: 14 },
});
