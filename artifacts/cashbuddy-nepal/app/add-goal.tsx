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
import COLORS from "@/constants/colors";
import { useApp } from "@/context/AppContext";

const GOAL_ICONS = [
  { id: "monitor", color: "#1565C0" },
  { id: "map", color: "#00C853" },
  { id: "shield", color: "#FF6D00" },
  { id: "home", color: "#9C27B0" },
  { id: "heart", color: "#E91E63" },
  { id: "book", color: "#F44336" },
  { id: "camera", color: "#00BCD4" },
  { id: "music", color: "#FF9800" },
  { id: "truck", color: "#607D8B" },
  { id: "globe", color: "#4CAF50" },
  { id: "gift", color: "#E91E63" },
  { id: "coffee", color: "#795548" },
];

export default function AddGoalScreen() {
  const insets = useSafeAreaInsets();
  const { addGoal } = useApp();
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");
  const [deadline, setDeadline] = useState("");
  const [selectedIcon, setSelectedIcon] = useState(GOAL_ICONS[0]);
  const [saving, setSaving] = useState(false);

  const topPadding = Platform.OS === "web" ? 67 : insets.top + 16;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  const getDefaultDeadline = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d.toISOString().split("T")[0];
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a goal title");
      return;
    }
    const targetAmt = parseFloat(target);
    if (!target || isNaN(targetAmt) || targetAmt <= 0) {
      Alert.alert("Error", "Please enter a valid target amount");
      return;
    }

    setSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    await addGoal({
      title: title.trim(),
      targetAmount: targetAmt,
      currentAmount: parseFloat(current) || 0,
      deadline: deadline
        ? new Date(deadline).toISOString()
        : new Date(getDefaultDeadline()).toISOString(),
      icon: selectedIcon.id,
      color: selectedIcon.color,
    });

    setSaving(false);
    router.back();
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
          <Feather name="x" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.title}>New Goal</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ gap: 24, paddingBottom: bottomPadding + 100 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Icon Picker */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Choose Icon</Text>
          <View style={styles.iconGrid}>
            {GOAL_ICONS.map((gi) => (
              <TouchableOpacity
                key={gi.id}
                style={[
                  styles.iconBtn,
                  selectedIcon.id === gi.id && {
                    backgroundColor: gi.color + "33",
                    borderColor: gi.color,
                  },
                ]}
                onPress={() => {
                  setSelectedIcon(gi);
                  Haptics.selectionAsync();
                }}
              >
                <Feather
                  name={gi.id as any}
                  size={20}
                  color={selectedIcon.id === gi.id ? gi.color : COLORS.darkTextSecondary}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Preview */}
        <LinearGradient
          colors={[selectedIcon.color + "44", selectedIcon.color + "11"]}
          style={styles.preview}
        >
          <View style={[styles.previewIcon, { backgroundColor: selectedIcon.color + "33" }]}>
            <Feather name={selectedIcon.id as any} size={32} color={selectedIcon.color} />
          </View>
          <Text style={styles.previewTitle}>{title || "My Goal"}</Text>
          <Text style={styles.previewTarget}>
            Target: Rs. {target || "0"}
          </Text>
        </LinearGradient>

        {/* Title */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Goal Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. New Laptop, Trip to Pokhara"
            placeholderTextColor={COLORS.darkTextSecondary}
          />
        </View>

        {/* Target Amount */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Target Amount (Rs.)</Text>
          <View style={styles.amountRow}>
            <Text style={styles.amountPrefix}>Rs.</Text>
            <TextInput
              style={styles.amountInput}
              value={target}
              onChangeText={setTarget}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={COLORS.darkTextSecondary}
            />
          </View>
        </View>

        {/* Current savings */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Already Saved (Rs.)</Text>
          <View style={styles.amountRow}>
            <Text style={styles.amountPrefix}>Rs.</Text>
            <TextInput
              style={styles.amountInput}
              value={current}
              onChangeText={setCurrent}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={COLORS.darkTextSecondary}
            />
          </View>
        </View>

        {/* Deadline */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Target Date (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={deadline}
            onChangeText={setDeadline}
            placeholder={getDefaultDeadline()}
            placeholderTextColor={COLORS.darkTextSecondary}
          />
        </View>

        {/* Tip */}
        {target && deadline && (
          <View style={styles.tipCard}>
            <Feather name="zap" size={16} color={COLORS.accent} />
            <Text style={styles.tipText}>
              Save Rs. {Math.ceil(
                (parseFloat(target) - (parseFloat(current) || 0)) /
                  Math.max(
                    Math.ceil((new Date(deadline || getDefaultDeadline()).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
                    1
                  )
              ).toLocaleString()} per day to reach your goal!
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Save */}
      <View style={[styles.footer, { paddingBottom: bottomPadding + 16 }]}>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[selectedIcon.color, selectedIcon.color + "CC"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveBtnGrad}
          >
            <Feather name="target" size={20} color={COLORS.white} />
            <Text style={styles.saveBtnText}>
              {saving ? "Creating..." : "Create Goal"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
  title: {
    color: COLORS.white,
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  scroll: { flex: 1, paddingHorizontal: 20 },
  field: { gap: 10 },
  fieldLabel: {
    color: COLORS.darkTextSecondary,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  iconBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.darkCard,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  preview: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 10,
  },
  previewIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  previewTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  previewTarget: {
    color: COLORS.darkTextSecondary,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  input: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.white,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.darkCard,
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    height: 56,
  },
  amountPrefix: {
    color: COLORS.darkTextSecondary,
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    color: COLORS.white,
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.accent + "18",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.accent + "33",
  },
  tipText: {
    flex: 1,
    color: COLORS.accent,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    lineHeight: 20,
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
