import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import { TransactionCategory, TransactionType, useApp } from "@/context/AppContext";
import { sendTransactionConfirmation } from "@/utils/notifications";

const RECURRING_OPTIONS = ["none", "daily", "weekly", "monthly"] as const;

export default function AddTransactionScreen() {
  const insets = useSafeAreaInsets();
  const { addTransaction } = useApp();

  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<TransactionCategory | null>(null);
  const [note, setNote] = useState("");
  const [recurring, setRecurring] = useState<"none" | "daily" | "weekly" | "monthly">("none");
  const [saving, setSaving] = useState(false);
  const noteRef = useRef<TextInput>(null);

  const topPadding = Platform.OS === "web" ? 52 : insets.top + 8;
  const bottomPadding = insets.bottom;
  const isExpense = type === "expense";
  const accentColor = isExpense ? COLORS.error : COLORS.success;

  const handleSave = async () => {
    const parsed = parseFloat(amount.replace(/,/g, ""));
    if (!amount || isNaN(parsed) || parsed <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount greater than 0");
      return;
    }
    if (!category) {
      Alert.alert("Select Category", "Please choose a category for this transaction");
      return;
    }

    setSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    await addTransaction({
      type,
      amount: parsed,
      category,
      note: note.trim(),
      date: new Date().toISOString(),
      tags: [],
      recurring,
    });

    await sendTransactionConfirmation(type, parsed, category);

    setSaving(false);
    router.back();
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={["#060D1F", "#0A1628", "#0D1B4B"]} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Feather name="x" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Add Transaction</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Type Toggle */}
      <View style={styles.typeToggle}>
        <TouchableOpacity
          style={[styles.typeBtn, isExpense && { backgroundColor: COLORS.error }]}
          onPress={() => { setType("expense"); setCategory(null); Haptics.selectionAsync(); }}
          activeOpacity={0.85}
        >
          <Feather name="arrow-down-circle" size={18} color={isExpense ? COLORS.white : COLORS.darkTextSecondary} />
          <Text style={[styles.typeBtnText, { color: isExpense ? COLORS.white : COLORS.darkTextSecondary }]}>Expense</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeBtn, !isExpense && { backgroundColor: COLORS.success }]}
          onPress={() => { setType("income"); setCategory(null); Haptics.selectionAsync(); }}
          activeOpacity={0.85}
        >
          <Feather name="arrow-up-circle" size={18} color={!isExpense ? COLORS.white : COLORS.darkTextSecondary} />
          <Text style={[styles.typeBtnText, { color: !isExpense ? COLORS.white : COLORS.darkTextSecondary }]}>Income</Text>
        </TouchableOpacity>
      </View>

      {/* Keyboard-aware form */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding + 100 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* Amount Card */}
          <View style={[styles.amountCard, { borderColor: accentColor + "88" }]}>
            <Text style={[styles.amountHint, { color: accentColor }]}>
              {isExpense ? "💸 EXPENSE AMOUNT" : "💚 INCOME AMOUNT"}
            </Text>
            <View style={styles.amountRow}>
              <Text style={[styles.amountRs, { color: accentColor }]}>Rs.</Text>
              <TextInput
                style={[styles.amountInput, { color: accentColor }]}
                value={amount}
                onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ""))}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={COLORS.darkBorder}
                autoFocus
                returnKeyType="next"
                onSubmitEditing={() => noteRef.current?.focus()}
              />
            </View>
            {amount !== "" && !isNaN(parseFloat(amount)) && (
              <Text style={[styles.amountWords, { color: accentColor + "AA" }]}>
                Rs. {parseFloat(amount).toLocaleString("en-NP")}
              </Text>
            )}
          </View>

          {/* Category */}
          <View style={styles.block}>
            <View style={styles.blockHeader}>
              <Feather name="grid" size={14} color={COLORS.primaryLight} />
              <Text style={styles.blockLabel}>CATEGORY</Text>
            </View>
            <CategoryPicker
              selected={category}
              type={type}
              onSelect={(c) => { setCategory(c); Haptics.selectionAsync(); }}
            />
          </View>

          {/* Note */}
          <View style={styles.block}>
            <View style={styles.blockHeader}>
              <Feather name="edit-3" size={14} color={COLORS.primaryLight} />
              <Text style={styles.blockLabel}>NOTE (OPTIONAL)</Text>
            </View>
            <TextInput
              ref={noteRef}
              style={styles.noteInput}
              value={note}
              onChangeText={setNote}
              placeholder="What was this for?"
              placeholderTextColor={COLORS.darkTextSecondary}
              returnKeyType="done"
              maxLength={120}
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Recurring */}
          <View style={styles.block}>
            <View style={styles.blockHeader}>
              <Feather name="repeat" size={14} color={COLORS.primaryLight} />
              <Text style={styles.blockLabel}>RECURRING</Text>
            </View>
            <View style={styles.recurringRow}>
              {RECURRING_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.pill, recurring === opt && { backgroundColor: COLORS.primary, borderColor: COLORS.primaryLight }]}
                  onPress={() => { setRecurring(opt); Haptics.selectionAsync(); }}
                >
                  <Text style={[styles.pillText, recurring === opt && { color: COLORS.white }]}>
                    {opt === "none" ? "One-time" : opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Fixed Save Button */}
        <View style={[styles.footer, { paddingBottom: Math.max(bottomPadding, 16) }]}>
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.65 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={isExpense ? ["#B71C1C", "#EF5350"] : ["#1B5E20", "#43A047"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveBtnInner}
            >
              {saving ? (
                <Text style={styles.saveBtnText}>Saving...</Text>
              ) : (
                <>
                  <Feather
                    name={isExpense ? "arrow-down-circle" : "arrow-up-circle"}
                    size={22}
                    color={COLORS.white}
                  />
                  <Text style={styles.saveBtnText}>
                    Save {isExpense ? "Expense" : "Income"}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#060D1F" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  title: { color: COLORS.white, fontSize: 18, fontFamily: "Inter_700Bold" },
  typeToggle: {
    flexDirection: "row",
    marginHorizontal: 18,
    marginBottom: 16,
    backgroundColor: COLORS.darkCard,
    borderRadius: 16,
    padding: 5,
    gap: 5,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  typeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
  },
  typeBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  scrollContent: { paddingHorizontal: 18, gap: 20, paddingTop: 4 },
  amountCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 22,
    padding: 22,
    borderWidth: 2,
    gap: 8,
  },
  amountHint: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  amountRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  amountRs: { fontSize: 28, fontFamily: "Inter_700Bold" },
  amountInput: {
    flex: 1,
    fontSize: 48,
    fontFamily: "Inter_700Bold",
    minWidth: 60,
    padding: 0,
  },
  amountWords: { fontSize: 13, fontFamily: "Inter_500Medium" },
  block: { gap: 10 },
  blockHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  blockLabel: {
    color: COLORS.darkTextSecondary,
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  noteInput: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.white,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    minHeight: 56,
    textAlignVertical: "top",
  },
  recurringRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: COLORS.darkCard,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  pillText: { color: COLORS.darkTextSecondary, fontSize: 13, fontFamily: "Inter_500Medium" },
  footer: {
    paddingHorizontal: 18,
    paddingTop: 14,
    backgroundColor: "rgba(6,13,31,0.95)",
    borderTopWidth: 1,
    borderTopColor: COLORS.darkBorder,
  },
  saveBtn: { borderRadius: 20, overflow: "hidden" },
  saveBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 20,
  },
  saveBtnText: {
    color: COLORS.white,
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.3,
  },
});
