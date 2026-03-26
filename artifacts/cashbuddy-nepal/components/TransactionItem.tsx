import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { CATEGORY_CONFIG, formatAmount, formatDate } from "@/constants/categories";
import COLORS from "@/constants/colors";
import { Transaction } from "@/context/AppContext";

interface Props {
  transaction: Transaction;
  onPress?: (t: Transaction) => void;
  onDelete?: (id: string) => void;
}

export function TransactionItem({ transaction, onPress, onDelete }: Props) {
  const scale = useSharedValue(1);
  const catConfig = CATEGORY_CONFIG[transaction.category];

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.97, { damping: 10, stiffness: 300 });
    setTimeout(() => {
      scale.value = withSpring(1);
    }, 100);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(transaction);
  };

  const isIncome = transaction.type === "income";

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        style={styles.container}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <View style={[styles.iconContainer, { backgroundColor: catConfig.color + "22" }]}>
          <Feather name={catConfig.icon as any} size={20} color={catConfig.color} />
        </View>

        <View style={styles.details}>
          <Text style={styles.note} numberOfLines={1}>
            {transaction.note || catConfig.label}
          </Text>
          <View style={styles.meta}>
            <Text style={styles.category}>{catConfig.label}</Text>
            <View style={styles.dot} />
            <Text style={styles.date}>{formatDate(transaction.date)}</Text>
          </View>
        </View>

        <View style={styles.amountContainer}>
          <Text
            style={[
              styles.amount,
              { color: isIncome ? COLORS.success : COLORS.error },
            ]}
          >
            {isIncome ? "+" : "-"} {formatAmount(transaction.amount)}
          </Text>
          {transaction.recurring !== "none" && (
            <View style={styles.recurringBadge}>
              <Feather name="repeat" size={10} color={COLORS.accent} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.darkBorder,
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  details: {
    flex: 1,
    gap: 4,
  },
  note: {
    color: COLORS.darkText,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  category: {
    color: COLORS.darkTextSecondary,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.darkTextSecondary,
  },
  date: {
    color: COLORS.darkTextSecondary,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  amountContainer: {
    alignItems: "flex-end",
    gap: 4,
  },
  amount: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  recurringBadge: {
    backgroundColor: COLORS.accent + "22",
    borderRadius: 6,
    padding: 2,
  },
});
