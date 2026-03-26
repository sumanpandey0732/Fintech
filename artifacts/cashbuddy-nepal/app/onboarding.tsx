import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
  SlideOutLeft,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import COLORS from "@/constants/colors";
import { useApp } from "@/context/AppContext";

const { width: SW, height: SH } = Dimensions.get("window");

const STEPS = [
  {
    icon: "dollar-sign",
    title: "Welcome to\nCashBuddy Nepal",
    subtitle: "Track your money, achieve your goals, and build financial freedom.",
    color: "#1565C0",
  },
  {
    icon: "user",
    title: "What's your name?",
    subtitle: "We'll personalise your experience just for you.",
    color: "#00897B",
  },
  {
    icon: "briefcase",
    title: "How much do you\ncurrently have?",
    subtitle: "Enter your current total balance in Nepali Rupees to get started.",
    color: "#6A1B9A",
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useApp();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [saving, setSaving] = useState(false);
  const nameRef = useRef<TextInput>(null);
  const balanceRef = useRef<TextInput>(null);

  const topPad = Platform.OS === "web" ? 60 : insets.top + 20;
  const botPad = Platform.OS === "web" ? 40 : insets.bottom + 20;

  const handleNext = () => {
    if (step === 1 && !name.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      if (step === 1) setTimeout(() => balanceRef.current?.focus(), 300);
    }
  };

  const handleFinish = async () => {
    const balNum = parseFloat(balance.replace(/,/g, "")) || 0;
    if (!name.trim()) return;
    setSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await completeOnboarding(name.trim(), balNum);
    router.replace("/(tabs)");
  };

  const currentStep = STEPS[step];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#060D1F", "#0A1628", "#0D1B4B"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative circles */}
      <View style={[styles.circle1, { backgroundColor: currentStep.color + "18" }]} />
      <View style={[styles.circle2, { backgroundColor: currentStep.color + "10" }]} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Progress dots */}
        <View style={[styles.dotsRow, { paddingTop: topPad }]}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === step && styles.dotActive,
                i < step && { backgroundColor: COLORS.success, width: 20 },
              ]}
            />
          ))}
        </View>

        {/* Icon */}
        <Animated.View
          key={`icon-${step}`}
          entering={FadeIn.duration(400)}
          style={styles.iconWrap}
        >
          <LinearGradient
            colors={[currentStep.color, currentStep.color + "BB"]}
            style={styles.iconCircle}
          >
            <Feather name={currentStep.icon as any} size={44} color={COLORS.white} />
          </LinearGradient>
        </Animated.View>

        {/* Text */}
        <Animated.View
          key={`text-${step}`}
          entering={FadeInDown.duration(400).delay(100)}
          style={styles.textSection}
        >
          <Text style={styles.title}>{currentStep.title}</Text>
          <Text style={styles.subtitle}>{currentStep.subtitle}</Text>
        </Animated.View>

        {/* Input */}
        <Animated.View
          key={`input-${step}`}
          entering={FadeInUp.duration(400).delay(200)}
          style={styles.inputSection}
        >
          {step === 1 && (
            <View style={styles.inputWrap}>
              <Feather name="user" size={20} color={COLORS.primaryLight} style={styles.inputIcon} />
              <TextInput
                ref={nameRef}
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Your full name"
                placeholderTextColor={COLORS.darkTextSecondary}
                autoFocus
                returnKeyType="next"
                onSubmitEditing={handleNext}
              />
            </View>
          )}
          {step === 2 && (
            <View style={styles.balanceWrap}>
              <Text style={styles.currencyLabel}>Rs.</Text>
              <TextInput
                ref={balanceRef}
                style={styles.balanceInput}
                value={balance}
                onChangeText={(v) => setBalance(v.replace(/[^0-9.]/g, ""))}
                placeholder="0"
                placeholderTextColor={COLORS.darkBorder}
                keyboardType="decimal-pad"
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleFinish}
              />
            </View>
          )}
          {step === 0 && (
            <View style={styles.featureList}>
              {[
                { icon: "trending-up", text: "Track income & expenses" },
                { icon: "target", text: "Set saving goals" },
                { icon: "cpu", text: "AI financial advisor" },
                { icon: "bar-chart-2", text: "Powerful analytics" },
              ].map((f) => (
                <View key={f.text} style={styles.featureRow}>
                  <View style={styles.featureIcon}>
                    <Feather name={f.icon as any} size={16} color={COLORS.primaryLight} />
                  </View>
                  <Text style={styles.featureText}>{f.text}</Text>
                </View>
              ))}
            </View>
          )}
        </Animated.View>

        {/* Button */}
        <View style={[styles.footer, { paddingBottom: botPad }]}>
          {step === STEPS.length - 1 ? (
            <TouchableOpacity
              style={[styles.btn, saving && { opacity: 0.7 }]}
              onPress={handleFinish}
              disabled={saving}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#00897B", "#00C853"]}
                style={styles.btnGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Feather name="check-circle" size={20} color={COLORS.white} />
                <Text style={styles.btnText}>
                  {saving ? "Setting up..." : "Start Tracking!"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.btn,
                step === 1 && !name.trim() && { opacity: 0.5 },
              ]}
              onPress={handleNext}
              disabled={step === 1 && !name.trim()}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[currentStep.color, currentStep.color + "BB"]}
                style={styles.btnGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.btnText}>
                  {step === 0 ? "Get Started" : "Continue"}
                </Text>
                <Feather name="arrow-right" size={20} color={COLORS.white} />
              </LinearGradient>
            </TouchableOpacity>
          )}

          {step > 0 && (
            <TouchableOpacity
              style={styles.backLink}
              onPress={() => setStep((s) => s - 1)}
            >
              <Text style={styles.backLinkText}>← Back</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.darkBg },
  circle1: {
    position: "absolute",
    width: SW * 1.2,
    height: SW * 1.2,
    borderRadius: SW * 0.6,
    top: -SW * 0.5,
    left: -SW * 0.1,
  },
  circle2: {
    position: "absolute",
    width: SW * 0.8,
    height: SW * 0.8,
    borderRadius: SW * 0.4,
    bottom: -SW * 0.2,
    right: -SW * 0.2,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.darkBorder,
  },
  dotActive: {
    backgroundColor: COLORS.primaryLight,
    width: 28,
    borderRadius: 4,
  },
  iconWrap: {
    alignItems: "center",
    marginTop: 16,
    marginBottom: 32,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  textSection: {
    paddingHorizontal: 32,
    gap: 12,
    marginBottom: 40,
    alignItems: "center",
  },
  title: {
    color: COLORS.white,
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    lineHeight: 42,
  },
  subtitle: {
    color: COLORS.darkTextSecondary,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 26,
  },
  inputSection: {
    paddingHorizontal: 28,
    flex: 1,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.darkCard,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: COLORS.primaryLight,
    paddingHorizontal: 16,
    height: 60,
    gap: 12,
  },
  inputIcon: { marginRight: 4 },
  input: {
    flex: 1,
    color: COLORS.white,
    fontSize: 18,
    fontFamily: "Inter_500Medium",
  },
  balanceWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: COLORS.primaryLight,
    paddingBottom: 8,
    paddingHorizontal: 8,
  },
  currencyLabel: {
    color: COLORS.darkTextSecondary,
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    marginRight: 8,
  },
  balanceInput: {
    flex: 1,
    color: COLORS.white,
    fontSize: 48,
    fontFamily: "Inter_700Bold",
  },
  featureList: {
    gap: 14,
    marginTop: 8,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight + "18",
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    color: COLORS.darkText,
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  footer: {
    paddingHorizontal: 28,
    paddingTop: 24,
    gap: 12,
  },
  btn: {
    borderRadius: 20,
    overflow: "hidden",
  },
  btnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
  },
  btnText: {
    color: COLORS.white,
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  backLink: {
    alignItems: "center",
    paddingVertical: 8,
  },
  backLinkText: {
    color: COLORS.darkTextSecondary,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
});
