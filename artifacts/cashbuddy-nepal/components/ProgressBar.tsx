import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import COLORS from "@/constants/colors";

interface Props {
  progress: number; // 0-1
  color?: string;
  height?: number;
  backgroundColor?: string;
}

export function ProgressBar({
  progress,
  color = COLORS.primary,
  height = 8,
  backgroundColor = COLORS.darkBorder,
}: Props) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(Math.min(progress, 1) * 100, { duration: 800 });
  }, [progress]);

  const animStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  const isOverBudget = progress > 1;

  return (
    <View style={[styles.track, { height, backgroundColor }]}>
      <Animated.View
        style={[
          styles.fill,
          {
            height,
            backgroundColor: isOverBudget ? COLORS.error : color,
          },
          animStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: 100,
    overflow: "hidden",
    width: "100%",
  },
  fill: {
    borderRadius: 100,
    minWidth: 4,
  },
});
