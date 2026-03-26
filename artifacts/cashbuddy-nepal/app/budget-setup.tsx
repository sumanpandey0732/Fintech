import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ProgressBar } from "@/components/ProgressBar";
import COLORS from "@/constants/colors";
import { CATEGORY_CONFIG, EXPENSE_CATEGORIES, formatAmount } from "@/constants/categories";
import { TransactionCategory, useApp } from "@/context/AppContext";

export default function BudgetSetupScreen() {
  const insets = useSafeAreaInsets();
  const { budgets, setBudget, deleteBudget, getCategorySpending } = useApp();
  const topPadding = Platform.OS === "web" ? 67 : insets.top + 16;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  const categorySpending = getCategorySpending();
  const [editing, setEditing] = useState<TransactionCategory | null>(null);
  const [budgetAmt, setBudgetAmt] = useState("");

  const handleSetBudget = (cat: TransactionCategory) => {
    const amount = parseFloat(budgetAmt);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Error", "Enter a valid amount");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setBudget({ category: cat, limit: amount, spent: categorySpending[cat] || 0 });
    setEditing(null);
    setBudgetAmt("");
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#060D1F", "#0A1628"]} style={StyleSheet.absoluteFill} />

      <View style={[styles.header, { paddingTop: topPadding }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="x" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Monthly Budgets</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ gap: 12, paddingBottom: bottomPadding + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.hint}>
          Set spending limits for each category to track your budget
        </Text>

        {EXPENSE_CATEGORIES.map((cat) => {
          const config = CATEGORY_CONFIG[cat];
          const budget = budgets.find((b) => b.category === cat);
          const spent = categorySpending[cat] || 0;
          const progress = budget ? spent / budget.limit : 0;
          const isEditing = editing === cat;

          return (
            <View key={cat} style={styles.catCard}>
              <View style={styles.catHeader}>
                <View style={[styles.catIcon, { backgroundColor: config.color + "22" }]}>
                  <Feather name={config.icon as any} size={18} color={config.color} />
                </View>
                <View style={styles.catInfo}>
                  <Text style={styles.catName}>{config.label}</Text>
                  <Text style={styles.catSpent}>
                    Spent: {formatAmount(spent)}
                    {budget ? ` / ${formatAmount(budget.limit)}` : ""}
                  </Text>
                </View>
                <View style={styles.catActions}>
                  {budget && (
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        deleteBudget(cat);
                      }}
                    >
                      <Feather name="trash-2" size={14} color={COLORS.error} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.editBtn, { backgroundColor: isEditing ? config.color : COLORS.darkCard }]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      if (isEditing) {
                        setEditing(null);
                      } else {
                        setEditing(cat);
                        setBudgetAmt(budget ? budget.limit.toString() : "");
                      }
                    }}
                  >
                    <Text style={[styles.editBtnText, isEditing && { color: COLORS.white }]}>
                      {budget ? "Edit" : "Set"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {budget && (
                <View style={styles.progressSection}>
                  <ProgressBar progress={progress} color={config.color} height={6} />
                  <View style={styles.progressRow}>
                    <Text style={styles.progressText}>
                      {(progress * 100).toFixed(0)}% used
                    </Text>
                    {progress > 0.8 && (
                      <View style={styles.warningBadge}>
                        <Feather name="alert-circle" size={10} color={progress >= 1 ? COLORS.error : COLORS.accentOrange} />
                        <Text style={[styles.warningText, { color: progress >= 1 ? COLORS.error : COLORS.accentOrange }]}>
                          {progress >= 1 ? "Over budget!" : "Almost there!"}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {isEditing && (
                <View style={styles.editSection}>
                  <View style={styles.inputRow}>
                    <Text style={styles.inputPrefix}>Rs.</Text>
                    <TextInput
                      style={styles.input}
                      value={budgetAmt}
                      onChangeText={setBudgetAmt}
                      keyboardType="numeric"
                      placeholder="Monthly limit"
                      placeholderTextColor={COLORS.darkTextSecondary}
                      autoFocus
                    />
                  </View>
                  <TouchableOpacity
                    style={[styles.saveBtn, { backgroundColor: config.color }]}
                    onPress={() => handleSetBudget(cat)}
                  >
                    <Text style={styles.saveBtnText}>Save</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.darkBg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.glassWhite,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  title: { color: COLORS.white, fontSize: 18, fontFamily: "Inter_700Bold" },
  scroll: { flex: 1, paddingHorizontal: 16 },
  hint: {
    color: COLORS.darkTextSecondary,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    marginBottom: 4,
  },
  catCard: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 18,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  catHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  catIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  catInfo: { flex: 1, gap: 3 },
  catName: { color: COLORS.darkText, fontSize: 15, fontFamily: "Inter_600SemiBold" },
  catSpent: { color: COLORS.darkTextSecondary, fontSize: 12, fontFamily: "Inter_400Regular" },
  catActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  actionBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.error + "18",
    borderRadius: 8,
  },
  editBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  editBtnText: { color: COLORS.primaryLight, fontSize: 13, fontFamily: "Inter_600SemiBold" },
  progressSection: { gap: 6 },
  progressRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  progressText: { color: COLORS.darkTextSecondary, fontSize: 12, fontFamily: "Inter_400Regular" },
  warningBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.error + "18",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  warningText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  editSection: { flexDirection: "row", gap: 10, alignItems: "center" },
  inputRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.darkBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    height: 48,
  },
  inputPrefix: { color: COLORS.darkTextSecondary, fontSize: 14, fontFamily: "Inter_600SemiBold", marginRight: 6 },
  input: { flex: 1, color: COLORS.white, fontSize: 16, fontFamily: "Inter_600SemiBold" },
  saveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  saveBtnText: { color: COLORS.white, fontSize: 14, fontFamily: "Inter_700Bold" },
});
