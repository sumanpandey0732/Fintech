import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CategoryPicker } from "@/components/CategoryPicker";
import COLORS from "@/constants/colors";
import { TransactionCategory, TransactionType, useApp } from "@/context/AppContext";
import { sendTransactionConfirmation, sendLowBalanceAlert } from "@/utils/notifications";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const RECURRING_OPTIONS = ["none", "daily", "weekly", "monthly"] as const;
const QUICK_AMOUNTS = [100, 500, 1000, 5000];

export default function AddTransactionScreen() {
  const insets = useSafeAreaInsets();
  const { addTransaction, getBalance } = useApp();
  const scrollViewRef = useRef<ScrollView>(null);

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

    // Check for low balance after expense and send alert
    if (type === "expense") {
      const newBalance = getBalance();
      if (newBalance < 5000 && newBalance >= 0) {
        await sendLowBalanceAlert(newBalance, "low");
      } else if (newBalance < 0) {
        await sendLowBalanceAlert(newBalance, "critical");
      }
    }

    setSaving(false);
    router.back();
  };

  const handleQuickAmount = (amt: number) => {
    setAmount(amt.toString());
    Haptics.selectionAsync();
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
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 25}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            ref={scrollViewRef}
            style={{ flex: 1 }}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding + 140 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={true}
            automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
            onContentSizeChange={() => {
              // Auto-scroll when content changes (keyboard opens)
            }}
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
            {/* Quick Amount Buttons */}
            <View style={styles.quickAmounts}>
              {QUICK_AMOUNTS.map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={[styles.quickAmtBtn, amount === amt.toString() && { backgroundColor: accentColor + "33", borderColor: accentColor }]}
                  onPress={() => handleQuickAmount(amt)}
                >
                  <Text style={[styles.quickAmtText, { color: amount === amt.toString() ? accentColor : COLORS.darkTextSecondary }]}>
                    Rs.{amt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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
              onFocus={() => {
                // Scroll to make note input visible when keyboard opens
                setTimeout(() => {
                  scrollViewRef.current?.scrollTo({ y: 280, animated: true });
                }, 100);
              }}
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
        </TouchableWithoutFeedback>

        {/* Fixed Save Button - Made Bigger */}
        <View style={[styles.footer, { paddingBottom: Math.max(bottomPadding, 20) }]}>
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
                    size={28}
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

// Responsive sizing based on screen dimensions
const isSmallScreen = SCREEN_WIDTH < 360;
const responsivePadding = isSmallScreen ? 14 : 18;
const responsiveFontSize = isSmallScreen ? 40 : 48;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#060D1F" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: responsivePadding,
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
    marginHorizontal: responsivePadding,
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
    paddingVertical: 14,
    borderRadius: 12,
  },
  typeBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  scrollContent: { paddingHorizontal: responsivePadding, gap: 20, paddingTop: 4 },
  amountCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 22,
    padding: isSmallScreen ? 16 : 22,
    borderWidth: 2,
    gap: 10,
  },
  amountHint: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  amountRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  amountRs: { fontSize: isSmallScreen ? 24 : 28, fontFamily: "Inter_700Bold" },
  amountInput: {
    flex: 1,
    fontSize: responsiveFontSize,
    fontFamily: "Inter_700Bold",
    minWidth: 60,
    padding: 0,
    width: "100%",
  },
  amountWords: { fontSize: 13, fontFamily: "Inter_500Medium" },
  quickAmounts: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
    flexWrap: "wrap",
  },
  quickAmtBtn: {
    paddingHorizontal: isSmallScreen ? 10 : 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: COLORS.darkCard,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  quickAmtText: {
    fontSize: isSmallScreen ? 11 : 12,
    fontFamily: "Inter_600SemiBold",
  },
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
    minHeight: isSmallScreen ? 60 : 70,
    maxHeight: 120,
    textAlignVertical: "top",
    width: "100%",
  },
  recurringRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  pill: {
    paddingHorizontal: isSmallScreen ? 12 : 16,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: COLORS.darkCard,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  pillText: { color: COLORS.darkTextSecondary, fontSize: 13, fontFamily: "Inter_500Medium" },
  footer: {
    paddingHorizontal: responsivePadding,
    paddingTop: 16,
    backgroundColor: "rgba(6,13,31,0.98)",
    borderTopWidth: 1,
    borderTopColor: COLORS.darkBorder,
  },
  saveBtn: { 
    borderRadius: 24, 
    overflow: "hidden",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  saveBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    paddingVertical: 22,
    minHeight: 64,
  },
  saveBtnText: {
    color: COLORS.white,
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
});
