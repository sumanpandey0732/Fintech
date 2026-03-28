import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CATEGORY_CONFIG, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/constants/categories";
import COLORS from "@/constants/colors";
import { TransactionCategory, TransactionType } from "@/context/AppContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const isSmallScreen = SCREEN_WIDTH < 360;
const numColumns = isSmallScreen ? 2 : 3;
const chipWidth = (SCREEN_WIDTH - 36 - (numColumns - 1) * 10) / numColumns; // 36 = padding (18*2)

interface Props {
  selected: TransactionCategory | null;
  type: TransactionType;
  onSelect: (c: TransactionCategory) => void;
}

export function CategoryPicker({ selected, type, onSelect }: Props) {
  const categories = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <View style={styles.container}>
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
                  size={isSmallScreen ? 14 : 16}
                  color={isSelected ? COLORS.white : config.color}
                />
              </View>
              <Text
                style={[
                  styles.chipText,
                  { color: isSelected ? config.color : COLORS.darkTextSecondary },
                ]}
                numberOfLines={1}
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: isSmallScreen ? 10 : 14,
    paddingVertical: isSmallScreen ? 8 : 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    backgroundColor: COLORS.darkCard,
    gap: isSmallScreen ? 6 : 8,
    minWidth: isSmallScreen ? 90 : 100,
    maxWidth: chipWidth,
  },
  iconWrap: {
    width: isSmallScreen ? 24 : 28,
    height: isSmallScreen ? 24 : 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: {
    fontSize: isSmallScreen ? 11 : 13,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
});
