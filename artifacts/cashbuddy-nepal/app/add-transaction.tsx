import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
  Dimensions,
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
import {
  TransactionCategory,
  TransactionType,
  useApp,
} from "@/context/AppContext";

const { height: SH } = Dimensions.get("window");
const COMPACT = SH < 700;

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
  const bottomPadding = Platform.OS === "web" ? 20 : insets.bottom;

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

    setSaving(false);
    router.back();
  };

  const isExpense = type === "expense";

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#060D1F", "#0A1628"]} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Feather name="x" size={20} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Add Transaction</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Type Toggle */}
      <View style={styles.typeToggle}>
        <TouchableOpacity
          style={[styles.typeBtn, isExpense && styles.typeBtnExpense]}
          onPress={() => { setType("expense"); setCategory(null); Haptics.selectionAsync(); }}
          activeOpacity={0.8}
        >
          <Feather name="arrow-down-circle" size={15} color={isExpense ? COLORS.white : COLORS.darkTextSecondary} />
          <Text style={[styles.typeBtnText, isExpense && { color: COLORS.white }]}>Expense</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeBtn, !isExpense && styles.typeBtnIncome]}
          onPress={() => { setType("income"); setCategory(null); Haptics.selectionAsync(); }}
          activeOpacity={0.8}
        >
          <Feather name="arrow-up-circle" size={15} color={!isExpense ? COLORS.white : COLORS.darkTextSecondary} />
          <Text style={[styles.typeBtnText, !isExpense && { color: COLORS.white }]}>Income</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding + 90 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* Amount */}
          <View style={[styles.amountCard, { borderColor: isExpense ? COLORS.error + "66" : COLORS.success + "66" }]}>
            <Text style={styles.amountHint}>Amount (Rs.)</Text>
            <View style={styles.amountRow}>
              <Text style={[styles.amountRs, { color: isExpense ? COLORS.error : COLORS.success }]}>Rs.</Text>
              <TextInput
                style={[styles.amountInput, { color: isExpense ? COLORS.error : COLORS.success }]}
                value={amount}
                onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ""))}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={COLORS.darkBorder}
                autoFocus
                returnKeyType="next"
                onSubmitEditing={() => noteRef.current?.focus()}
              />
            </View>
          </View>

          {/* Category */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionLabel}>Category</Text>
            <CategoryPicker
              selected={category}
              type={type}
              onSelect={(c) => { setCategory(c); Haptics.selectionAsync(); }}
            />
          </View>

          {/* Note */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionLabel}>Note (optional)</Text>
            <TextInput
              ref={noteRef}
              style={styles.noteInput}
              value={note}
              onChangeText={setNote}
              placeholder="What was it for?"
              placeholderTextColor={COLORS.darkTextSecondary}
              returnKeyType="done"
              maxLength={100}
            />
          </View>

          {/* Recurring — compact pills */}
          {!COMPACT && (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionLabel}>Recurring</Text>
              <View style={styles.recurringRow}>
                {RECURRING_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.pill, recurring === opt && styles.pillActive]}
                    onPress={() => { setRecurring(opt); Haptics.selectionAsync(); }}
                  >
                    <Text style={[styles.pillText, recurring === opt && styles.pillTextActive]}>
                      {opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Save Button — pinned at bottom */}
        <View style={[styles.footer, { paddingBottom: bottomPadding + 12 }]}>
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={isExpense ? ["#C62828", "#FF1744"] : ["#00897B", "#00C853"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveBtnGrad}
            >
              <Feather
                name={isExpense ? "arrow-down-circle" : "arrow-up-circle"}
                size={20}
                color={COLORS.white}
              />
              <Text style={styles.saveBtnText}>
                {saving ? "Saving..." : `Save ${isExpense ? "Expense" : "Income"}`}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.darkBg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingBottom: 10,
  },
  closeBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.glassWhite,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  title: {
    color: COLORS.white,
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  typeToggle: {
    flexDirection: "row",
    marginHorizontal: 18,
    marginBottom: 14,
    backgroundColor: COLORS.darkCard,
    borderRadius: 14,
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
    gap: 6,
    paddingVertical: 10,
    borderRadius: 11,
  },
  typeBtnExpense: { backgroundColor: COLORS.error },
  typeBtnIncome: { backgroundColor: COLORS.success },
  typeBtnText: {
    color: COLORS.darkTextSecondary,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 18,
    gap: 18,
    paddingTop: 4,
  },
  amountCard: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 18,
    padding: 18,
    borderWidth: 2,
    gap: 6,
  },
  amountHint: {
    color: COLORS.darkTextSecondary,
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  amountRs: {
    fontSize: 26,
    fontFamily: "Inter_600SemiBold",
  },
  amountInput: {
    flex: 1,
    fontSize: COMPACT ? 36 : 44,
    fontFamily: "Inter_700Bold",
    minWidth: 60,
  },
  sectionBlock: { gap: 8 },
  sectionLabel: {
    color: COLORS.darkTextSecondary,
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
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
    height: 52,
  },
  recurringRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.darkCard,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  pillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryLight,
  },
  pillText: {
    color: COLORS.darkTextSecondary,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  pillTextActive: { color: COLORS.white },
  footer: {
    paddingHorizontal: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.darkBorder,
    backgroundColor: COLORS.darkBg,
  },
  saveBtn: { borderRadius: 18, overflow: "hidden" },
  saveBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: COMPACT ? 14 : 17,
  },
  saveBtnText: {
    color: COLORS.white,
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
});
