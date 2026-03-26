import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GradientBackground } from "@/components/GradientBackground";
import { ProgressBar } from "@/components/ProgressBar";
import COLORS from "@/constants/colors";
import { formatAmount } from "@/constants/categories";
import {
  getLevelTitle,
  getXpForNextLevel,
  useApp,
} from "@/context/AppContext";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profile, updateProfile, achievements, goals, transactions } = useApp();
  const topPadding = Platform.OS === "web" ? 67 : insets.top + 16;

  const xpForNext = getXpForNextLevel(profile.level);
  const levelTitle = getLevelTitle(profile.level);

  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const txCount = transactions.length;
  const incomeCount = transactions.filter((t) => t.type === "income").length;

  const unlockedAchievements = achievements.filter((a) =>
    profile.achievements.includes(a.id)
  );

  const handleClearData = () => {
    Alert.alert(
      "Clear All Data",
      "This will permanently delete all your transactions, budgets and goals. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ]
    );
  };

  return (
    <GradientBackground colors={["#060D1F", "#0A1628", "#0D1B4B"]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 120 : 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Hero */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <LinearGradient
            colors={["#0D1B4B", "#1565C0"]}
            style={[styles.hero, { paddingTop: topPadding + 16 }]}
          >
            <View style={styles.avatarWrap}>
              <View style={styles.avatar}>
                <Feather name="user" size={36} color={COLORS.white} />
              </View>
              <View style={styles.levelBadge}>
                <Text style={styles.levelNum}>{profile.level}</Text>
              </View>
            </View>
            <Text style={styles.name}>{profile.name}</Text>
            <Text style={styles.levelTitle}>{levelTitle}</Text>

            <View style={styles.xpSection}>
              <View style={styles.xpRow}>
                <Text style={styles.xpLabel}>XP: {profile.xp}</Text>
                <Text style={styles.xpLabel}>{xpForNext - profile.xp} to next level</Text>
              </View>
              <ProgressBar
                progress={profile.xp / xpForNext}
                color={COLORS.accent}
                height={6}
                backgroundColor="rgba(255,255,255,0.2)"
              />
            </View>

            <View style={styles.heroStats}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatVal}>{txCount}</Text>
                <Text style={styles.heroStatLabel}>Transactions</Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatVal}>{profile.streak}</Text>
                <Text style={styles.heroStatLabel}>Day Streak</Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatVal}>{unlockedAchievements.length}</Text>
                <Text style={styles.heroStatLabel}>Badges</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Stats */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Stats</Text>
          <View style={styles.statsGrid}>
            <StatBox icon="trending-up" label="Total Saved" value={formatAmount(totalSaved)} color={COLORS.success} />
            <StatBox icon="activity" label="Transactions" value={txCount.toString()} color={COLORS.primaryLight} />
            <StatBox icon="dollar-sign" label="Income sources" value={incomeCount.toString()} color={COLORS.accent} />
            <StatBox icon="award" label="Achievements" value={`${unlockedAchievements.length}/${achievements.length}`} color="#A78BFA" />
          </View>
        </Animated.View>

        {/* Achievements */}
        <Animated.View
          entering={FadeInDown.delay(150).duration(400)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Achievements</Text>
          <View style={styles.card}>
            {achievements.map((a) => {
              const unlocked = profile.achievements.includes(a.id);
              return (
                <View key={a.id} style={[styles.achieveRow, !unlocked && styles.achieveLocked]}>
                  <View
                    style={[
                      styles.achieveIcon,
                      { backgroundColor: unlocked ? COLORS.accent + "22" : COLORS.darkBorder },
                    ]}
                  >
                    <Feather
                      name={a.icon as any}
                      size={18}
                      color={unlocked ? COLORS.accent : COLORS.darkTextSecondary}
                    />
                  </View>
                  <View style={styles.achieveInfo}>
                    <Text
                      style={[
                        styles.achieveTitle,
                        !unlocked && { color: COLORS.darkTextSecondary },
                      ]}
                    >
                      {a.title}
                    </Text>
                    <Text style={styles.achieveDesc}>{a.description}</Text>
                  </View>
                  <View>
                    {unlocked ? (
                      <Feather name="check-circle" size={18} color={COLORS.success} />
                    ) : (
                      <View style={styles.xpPill}>
                        <Feather name="zap" size={10} color={COLORS.accent} />
                        <Text style={styles.xpPillText}>{a.xpReward}</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* Settings */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.card}>
            <SettingRow
              icon="moon"
              label="Dark Mode"
              right={
                <Switch
                  value={profile.darkMode}
                  onValueChange={(v) => updateProfile({ darkMode: v })}
                  trackColor={{ false: COLORS.darkBorder, true: COLORS.primary }}
                  thumbColor={COLORS.white}
                />
              }
            />
            <SettingRow
              icon="bell"
              label="Notifications"
              right={<Feather name="chevron-right" size={18} color={COLORS.darkTextSecondary} />}
            />
            <SettingRow
              icon="shield"
              label="Security & PIN"
              right={<Feather name="chevron-right" size={18} color={COLORS.darkTextSecondary} />}
            />
            <SettingRow
              icon="download"
              label="Export Data"
              right={<Feather name="chevron-right" size={18} color={COLORS.darkTextSecondary} />}
            />
            <TouchableOpacity onPress={handleClearData}>
              <SettingRow
                icon="trash-2"
                label="Clear All Data"
                iconColor={COLORS.error}
                labelColor={COLORS.error}
                right={<Feather name="chevron-right" size={18} color={COLORS.error} />}
              />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>CashBuddy Nepal Pro v1.0</Text>
          <Text style={styles.appInfoSub}>Made with love in Nepal</Text>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

function StatBox({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={[statStyles.box]}>
      <View style={[statStyles.icon, { backgroundColor: color + "22" }]}>
        <Feather name={icon as any} size={18} color={color} />
      </View>
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  box: {
    width: "48%",
    backgroundColor: COLORS.darkCard,
    borderRadius: 16,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    color: COLORS.white,
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  label: {
    color: COLORS.darkTextSecondary,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});

function SettingRow({
  icon,
  label,
  right,
  iconColor,
  labelColor,
}: {
  icon: string;
  label: string;
  right?: React.ReactNode;
  iconColor?: string;
  labelColor?: string;
}) {
  return (
    <View style={settingStyles.row}>
      <View style={settingStyles.left}>
        <Feather
          name={icon as any}
          size={18}
          color={iconColor ?? COLORS.primaryLight}
        />
        <Text style={[settingStyles.label, labelColor ? { color: labelColor } : {}]}>
          {label}
        </Text>
      </View>
      {right}
    </View>
  );
}

const settingStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.darkBorder,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  label: {
    color: COLORS.darkText,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
});

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    alignItems: "center",
    gap: 6,
  },
  avatarWrap: {
    position: "relative",
    marginBottom: 4,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.glassWhite,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: COLORS.glassBorder,
  },
  levelBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.darkBg,
  },
  levelNum: {
    color: COLORS.darkBg,
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  name: {
    color: COLORS.white,
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    marginTop: 4,
  },
  levelTitle: {
    color: COLORS.accent,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  xpSection: {
    width: "100%",
    gap: 8,
    marginTop: 8,
  },
  xpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  xpLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  heroStats: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 16,
    width: "100%",
  },
  heroStat: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  heroStatVal: {
    color: COLORS.white,
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  heroStatLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  heroDivider: {
    width: 1,
    height: 36,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginBottom: 14,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  card: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  achieveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.darkBorder,
  },
  achieveLocked: {
    opacity: 0.5,
  },
  achieveIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  achieveInfo: {
    flex: 1,
    gap: 2,
  },
  achieveTitle: {
    color: COLORS.darkText,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  achieveDesc: {
    color: COLORS.darkTextSecondary,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  xpPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: COLORS.accent + "18",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  xpPillText: {
    color: COLORS.accent,
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  appInfo: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 4,
  },
  appInfoText: {
    color: COLORS.darkTextSecondary,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  appInfoSub: {
    color: COLORS.darkTextSecondary + "88",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
