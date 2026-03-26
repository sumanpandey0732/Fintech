import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import COLORS from "@/constants/colors";
import { CATEGORY_CONFIG, formatAmount, formatDate } from "@/constants/categories";
import { useApp } from "@/context/AppContext";

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { transactions, deleteTransaction } = useApp();

  const topPadding = Platform.OS === "web" ? 67 : insets.top + 16;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  const transaction = transactions.find((t) => t.id === id);

  if (!transaction) {
    return (
      <View style={styles.container}>
        <Text style={{ color: COLORS.white, textAlign: "center", marginTop: 100 }}>
          Transaction not found
        </Text>
      </View>
    );
  }

  const config = CATEGORY_CONFIG[transaction.category];
  const isIncome = transaction.type === "income";

  const handleDelete = () => {
    Alert.alert("Delete Transaction", "Are you sure you want to delete this transaction?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          deleteTransaction(transaction.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#060D1F", "#0A1628"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
          <Feather name="trash-2" size={18} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <LinearGradient
          colors={isIncome ? ["#00897B", "#00C853"] : ["#B71C1C", "#FF1744"]}
          style={styles.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.heroDecor} />
          <View style={[styles.heroIcon, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
            <Feather name={config.icon as any} size={32} color={COLORS.white} />
          </View>
          <Text style={styles.heroAmount}>
            {isIncome ? "+" : "-"} {formatAmount(transaction.amount)}
          </Text>
          <Text style={styles.heroType}>{isIncome ? "Income" : "Expense"}</Text>
        </LinearGradient>

        {/* Details */}
        <View style={styles.details}>
          <DetailRow icon="tag" label="Category" value={config.label} />
          <DetailRow icon="edit-3" label="Note" value={transaction.note || "No note"} />
          <DetailRow icon="calendar" label="Date" value={formatDate(transaction.date)} />
          {transaction.tags.length > 0 && (
            <DetailRow icon="hash" label="Tags" value={transaction.tags.join(", ")} />
          )}
          {transaction.recurring !== "none" && (
            <DetailRow icon="repeat" label="Recurring" value={transaction.recurring} />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={drStyles.row}>
      <View style={drStyles.iconWrap}>
        <Feather name={icon as any} size={16} color={COLORS.primaryLight} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={drStyles.label}>{label}</Text>
        <Text style={drStyles.value}>{value}</Text>
      </View>
    </View>
  );
}

const drStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.darkBorder,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight + "18",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  label: {
    color: COLORS.darkTextSecondary,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginBottom: 2,
  },
  value: {
    color: COLORS.darkText,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
});

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
  deleteBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.error + "22",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.error + "44",
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  hero: {
    margin: 16,
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    gap: 8,
    overflow: "hidden",
  },
  heroDecor: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.05)",
    top: -60,
    right: -60,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  heroAmount: {
    color: COLORS.white,
    fontSize: 36,
    fontFamily: "Inter_700Bold",
  },
  heroType: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  details: {
    marginHorizontal: 16,
    backgroundColor: COLORS.darkCard,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
});
