import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CATEGORY_CONFIG, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/constants/categories";
import COLORS from "@/constants/colors";
import { TransactionCategory, TransactionType } from "@/context/AppContext";

interface Props {
  selected: TransactionCategory | null;
  type: TransactionType;
  onSelect: (c: TransactionCategory) => void;
}

export function CategoryPicker({ selected, type, onSelect }: Props) {
  const categories = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Category</Text>
      <View style={styles.grid}>
        {categories.map((cat) => {
          const config = CATEGORY_CONFIG[cat];
          const isSelected = selected === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[
                styles.chip,
                isSelected && { backgroundColor: config.color + "33", borderColor: config.color },
              ]}
              onPress={() => onSelect(cat)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: isSelected ? config.color : config.color + "22" },
                ]}
              >
                <Feather
                  name={config.icon as any}
                  size={16}
                  color={isSelected ? COLORS.white : config.color}
                />
              </View>
              <Text
                style={[
                  styles.chipText,
                  { color: isSelected ? config.color : COLORS.darkTextSecondary },
                ]}
              >
                {config.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  label: {
    color: COLORS.darkTextSecondary,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    backgroundColor: COLORS.darkCard,
    gap: 8,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
});
