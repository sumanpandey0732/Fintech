import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CategoryPicker } from "@/components/CategoryPicker";
import COLORS from "@/constants/colors";
import {
  TransactionCategory,
  TransactionType,
  useApp,
} from "@/context/AppContext";

const RECURRING_OPTIONS = ["none", "daily", "weekly", "monthly"] as const;

export default function AddTransactionScreen() {
  const insets = useSafeAreaInsets();
  const { addTransaction } = useApp();
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<TransactionCategory | null>(null);
  const [note, setNote] = useState("");
  const [tags, setTags] = useState("");
  const [recurring, setRecurring] = useState<"none" | "daily" | "weekly" | "monthly">("none");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);

  const topPadding = Platform.OS === "web" ? 67 : insets.top + 16;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }
    if (!category) {
      Alert.alert("Error", "Please select a category");
      return;
    }

    setSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    await addTransaction({
      type,
      amount: parseFloat(amount),
      category,
      note,
      date: new Date(date).toISOString(),
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      recurring,
    });

    setSaving(false);
    router.back();
  };

  return (
    <View style={[styles.container]}>
      <LinearGradient
        colors={["#060D1F", "#0A1628"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="x" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Add Transaction</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Type Toggle */}
      <View style={styles.typeToggle}>
        <Pressable
          style={[styles.typeBtn, type === "expense" && styles.typeBtnExpense]}
          onPress={() => {
            setType("expense");
            setCategory(null);
            Haptics.selectionAsync();
          }}
        >
          <Feather
            name="arrow-down-circle"
            size={16}
            color={type === "expense" ? COLORS.white : COLORS.darkTextSecondary}
          />
          <Text
            style={[
              styles.typeBtnText,
              type === "expense" && styles.typeBtnTextActive,
            ]}
          >
            Expense
          </Text>
        </Pressable>
        <Pressable
          style={[styles.typeBtn, type === "income" && styles.typeBtnIncome]}
          onPress={() => {
            setType("income");
            setCategory(null);
            Haptics.selectionAsync();
          }}
        >
          <Feather
            name="arrow-up-circle"
            size={16}
            color={type === "income" ? COLORS.white : COLORS.darkTextSecondary}
          />
          <Text
            style={[
              styles.typeBtnText,
              type === "income" && styles.typeBtnTextActive,
            ]}
          >
            Income
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ gap: 24, paddingBottom: bottomPadding + 100 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Amount */}
        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>Amount (Rs.)</Text>
          <View style={styles.amountRow}>
            <Text style={styles.amountPrefix}>Rs.</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={COLORS.darkBorder}
              autoFocus
            />
          </View>
        </View>

        {/* Category */}
        <CategoryPicker
          selected={category}
          type={type}
          onSelect={(c) => {
            setCategory(c);
            Haptics.selectionAsync();
          }}
        />

        {/* Note */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Note</Text>
          <TextInput
            style={styles.fieldInput}
            value={note}
            onChangeText={setNote}
            placeholder="What was it for?"
            placeholderTextColor={COLORS.darkTextSecondary}
            multiline
          />
        </View>

        {/* Tags */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Tags (comma-separated)</Text>
          <TextInput
            style={styles.fieldInput}
            value={tags}
            onChangeText={setTags}
            placeholder="e.g. work, grocery, urgent"
            placeholderTextColor={COLORS.darkTextSecondary}
          />
        </View>

        {/* Recurring */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Recurring</Text>
          <View style={styles.recurringRow}>
            {RECURRING_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.recurringBtn,
                  recurring === opt && styles.recurringActive,
                ]}
                onPress={() => {
                  setRecurring(opt);
                  Haptics.selectionAsync();
                }}
              >
                <Text
                  style={[
                    styles.recurringText,
                    recurring === opt && styles.recurringTextActive,
                  ]}
                >
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View
        style={[
          styles.footer,
          { paddingBottom: bottomPadding + 16 },
        ]}
      >
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={
              type === "expense"
                ? (["#C62828", "#FF1744"] as const)
                : (["#00897B", "#00C853"] as const)
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveBtnGrad}
          >
            <Feather
              name={type === "expense" ? "arrow-down-circle" : "arrow-up-circle"}
              size={20}
              color={COLORS.white}
            />
            <Text style={styles.saveBtnText}>
              {saving ? "Saving..." : `Save ${type === "expense" ? "Expense" : "Income"}`}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.darkBg,
  },
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
  title: {
    color: COLORS.white,
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  typeToggle: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: COLORS.darkCard,
    borderRadius: 16,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  typeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 13,
  },
  typeBtnExpense: {
    backgroundColor: COLORS.error,
  },
  typeBtnIncome: {
    backgroundColor: COLORS.success,
  },
  typeBtnText: {
    color: COLORS.darkTextSecondary,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  typeBtnTextActive: {
    color: COLORS.white,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  amountSection: {
    gap: 8,
  },
  amountLabel: {
    color: COLORS.darkTextSecondary,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primaryLight,
    paddingBottom: 8,
  },
  amountPrefix: {
    color: COLORS.darkTextSecondary,
    fontSize: 28,
    fontFamily: "Inter_600SemiBold",
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    color: COLORS.white,
    fontSize: 40,
    fontFamily: "Inter_700Bold",
  },
  field: {
    gap: 10,
  },
  fieldLabel: {
    color: COLORS.darkTextSecondary,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  fieldInput: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.white,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    minHeight: 52,
  },
  recurringRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  recurringBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.darkCard,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  recurringActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryLight,
  },
  recurringText: {
    color: COLORS.darkTextSecondary,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  recurringTextActive: {
    color: COLORS.white,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.darkBorder,
    backgroundColor: COLORS.darkBg,
  },
  saveBtn: {
    borderRadius: 20,
    overflow: "hidden",
  },
  saveBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    borderRadius: 20,
  },
  saveBtnText: {
    color: COLORS.white,
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
});
