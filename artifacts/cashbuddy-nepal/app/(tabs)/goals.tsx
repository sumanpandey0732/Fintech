import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GradientBackground } from "@/components/GradientBackground";
import { ProgressBar } from "@/components/ProgressBar";
import COLORS from "@/constants/colors";
import { formatAmount } from "@/constants/categories";
import { SavingGoal, useApp } from "@/context/AppContext";

export default function GoalsScreen() {
  const insets = useSafeAreaInsets();
  const { goals, deleteGoal, addToGoal } = useApp();
  const [addFundGoal, setAddFundGoal] = useState<SavingGoal | null>(null);
  const [fundAmount, setFundAmount] = useState("");
  const topPadding = Platform.OS === "web" ? 67 : insets.top + 16;

  const totalGoals = goals.length;
  const completedGoals = goals.filter((g) => g.currentAmount >= g.targetAmount).length;
  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);

  const handleAddFund = () => {
    if (!addFundGoal || !fundAmount) return;
    const amount = parseFloat(fundAmount);
    if (isNaN(amount) || amount <= 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addToGoal(addFundGoal.id, amount);
    setAddFundGoal(null);
    setFundAmount("");
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete Goal", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          deleteGoal(id);
        },
      },
    ]);
  };

  return (
    <GradientBackground colors={["#060D1F", "#0A1628", "#0D1B4B"]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 120 : 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={[styles.header, { paddingTop: topPadding }]}
        >
          <View>
            <Text style={styles.title}>Saving Goals</Text>
            <Text style={styles.subtitle}>
              {completedGoals}/{totalGoals} completed
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/add-goal");
            }}
          >
            <Feather name="plus" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </Animated.View>

        {/* Summary */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={styles.summaryRow}
        >
          <LinearGradient
            colors={["#0D47A1", "#1565C0"]}
            style={styles.summaryCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Feather name="dollar-sign" size={24} color={COLORS.accent} />
            <Text style={styles.summaryLabel}>Total Saved</Text>
            <Text style={styles.summaryValue}>{formatAmount(totalSaved)}</Text>
          </LinearGradient>
          <View style={styles.summaryRight}>
            <View style={[styles.miniStat, { backgroundColor: COLORS.success + "18" }]}>
              <Feather name="check-circle" size={16} color={COLORS.success} />
              <Text style={[styles.miniStatVal, { color: COLORS.success }]}>
                {completedGoals} Done
              </Text>
            </View>
            <View style={[styles.miniStat, { backgroundColor: COLORS.primaryLight + "18" }]}>
              <Feather name="clock" size={16} color={COLORS.primaryLight} />
              <Text style={[styles.miniStatVal, { color: COLORS.primaryLight }]}>
                {totalGoals - completedGoals} Active
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Goals */}
        {goals.length === 0 ? (
          <Animated.View
            entering={FadeInDown.delay(200).duration(400)}
            style={styles.empty}
          >
            <Feather name="target" size={48} color={COLORS.darkTextSecondary} />
            <Text style={styles.emptyTitle}>No goals yet</Text>
            <Text style={styles.emptyText}>
              Start saving for something you love
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push("/add-goal")}
            >
              <Text style={styles.emptyBtnText}>Create your first goal</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <View style={styles.goalsList}>
            {goals.map((goal, i) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                index={i}
                onAddFund={() => {
                  setAddFundGoal(goal);
                  setFundAmount("");
                }}
                onDelete={() => handleDelete(goal.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Funds Modal */}
      <Modal
        visible={!!addFundGoal}
        animationType="slide"
        transparent
        onRequestClose={() => setAddFundGoal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add to {addFundGoal?.title}</Text>
            <Text style={styles.modalSub}>
              Current: {formatAmount(addFundGoal?.currentAmount ?? 0)} /{" "}
              {formatAmount(addFundGoal?.targetAmount ?? 0)}
            </Text>
            <View style={styles.inputRow}>
              <Text style={styles.inputPrefix}>Rs.</Text>
              <TextInput
                style={styles.input}
                value={fundAmount}
                onChangeText={setFundAmount}
                keyboardType="numeric"
                placeholder="Enter amount"
                placeholderTextColor={COLORS.darkTextSecondary}
                autoFocus
              />
            </View>
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setAddFundGoal(null)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleAddFund}
              >
                <LinearGradient
                  colors={["#0D47A1", "#1565C0"]}
                  style={styles.saveBtnGrad}
                >
                  <Text style={styles.saveText}>Add Funds</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </GradientBackground>
  );
}

function GoalCard({
  goal,
  index,
  onAddFund,
  onDelete,
}: {
  goal: SavingGoal;
  index: number;
  onAddFund: () => void;
  onDelete: () => void;
}) {
  const progress = goal.currentAmount / goal.targetAmount;
  const isComplete = progress >= 1;
  const remaining = goal.targetAmount - goal.currentAmount;

  const deadline = new Date(goal.deadline);
  const now = new Date();
  const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const dailySaving = daysLeft > 0 ? remaining / daysLeft : 0;

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).duration(400)}>
      <View style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <View style={[styles.goalIcon, { backgroundColor: goal.color + "22" }]}>
            <Feather name={goal.icon as any} size={20} color={goal.color} />
          </View>
          <View style={styles.goalInfo}>
            <Text style={styles.goalTitle}>{goal.title}</Text>
            <Text style={styles.goalDeadline}>
              {daysLeft > 0 ? `${daysLeft} days left` : "Deadline passed"}
            </Text>
          </View>
          {isComplete ? (
            <View style={styles.completeBadge}>
              <Feather name="check" size={14} color={COLORS.success} />
              <Text style={styles.completeText}>Done!</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
              <Feather name="trash-2" size={14} color={COLORS.darkTextSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.goalAmounts}>
          <Text style={styles.savedAmount}>{formatAmount(goal.currentAmount)}</Text>
          <Text style={styles.targetAmount}> / {formatAmount(goal.targetAmount)}</Text>
        </View>

        <ProgressBar
          progress={progress}
          color={isComplete ? COLORS.success : goal.color}
          height={8}
        />

        <View style={styles.goalFooter}>
          <View>
            <Text style={styles.progressPct}>{(progress * 100).toFixed(0)}% achieved</Text>
            {!isComplete && dailySaving > 0 && (
              <Text style={styles.dailySuggestion}>
                Save {formatAmount(Math.ceil(dailySaving))}/day
              </Text>
            )}
          </View>
          {!isComplete && (
            <TouchableOpacity
              style={[styles.addFundBtn, { backgroundColor: goal.color }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onAddFund();
              }}
            >
              <Feather name="plus" size={14} color={COLORS.white} />
              <Text style={styles.addFundText}>Add</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    color: COLORS.white,
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    color: COLORS.darkTextSecondary,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    gap: 8,
    alignItems: "flex-start",
  },
  summaryLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  summaryValue: {
    color: COLORS.white,
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  summaryRight: {
    gap: 10,
    justifyContent: "center",
  },
  miniStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  miniStatVal: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  goalsList: {
    paddingHorizontal: 16,
    gap: 14,
  },
  goalCard: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 20,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  goalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  goalIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    color: COLORS.darkText,
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  goalDeadline: {
    color: COLORS.darkTextSecondary,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  completeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.success + "18",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  completeText: {
    color: COLORS.success,
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  deleteBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  goalAmounts: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  savedAmount: {
    color: COLORS.white,
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  targetAmount: {
    color: COLORS.darkTextSecondary,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  goalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressPct: {
    color: COLORS.darkText,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  dailySuggestion: {
    color: COLORS.darkTextSecondary,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  addFundBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addFundText: {
    color: COLORS.white,
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  empty: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    marginTop: 8,
  },
  emptyText: {
    color: COLORS.darkTextSecondary,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  emptyBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 8,
  },
  emptyBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: COLORS.darkCard,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    gap: 16,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: COLORS.darkBorder,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.darkBorder,
    alignSelf: "center",
    marginBottom: 8,
  },
  modalTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  modalSub: {
    color: COLORS.darkTextSecondary,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.darkBg,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    height: 56,
  },
  inputPrefix: {
    color: COLORS.darkTextSecondary,
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: COLORS.white,
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  modalBtns: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: COLORS.darkBg,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  cancelText: {
    color: COLORS.darkTextSecondary,
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  saveBtn: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  saveBtnGrad: {
    padding: 16,
    alignItems: "center",
    borderRadius: 16,
  },
  saveText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
});
