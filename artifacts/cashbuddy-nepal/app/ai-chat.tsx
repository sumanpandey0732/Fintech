import { Feather } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import COLORS from "@/constants/colors";
import { formatAmount } from "@/constants/categories";
import { ChatMessage, useApp } from "@/context/AppContext";

const API_KEY: string = (Constants.expoConfig?.extra?.apiKey as string) || "";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "mistralai/mistral-7b-instruct:free";

async function callOpenRouter(
  messages: { role: string; content: string }[]
): Promise<string> {
  if (!API_KEY) {
    return "AI advisor is not configured. Please add your OpenRouter API key to enable real AI responses.";
  }
  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://cashbuddy-nepal.app",
        "X-Title": "CashBuddy Nepal Pro",
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        max_tokens: 400,
        temperature: 0.7,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return (
      data.choices?.[0]?.message?.content?.trim() ||
      "Sorry, I couldn't get a response. Please try again."
    );
  } catch (e) {
    return "Connection error. Please check your internet and try again.";
  }
}

function buildSystemPrompt(
  balance: number,
  monthlyIncome: number,
  monthlyExpenses: number,
  name: string
): string {
  const savings = monthlyIncome - monthlyExpenses;
  const savingsRate =
    monthlyIncome > 0
      ? ((savings / monthlyIncome) * 100).toFixed(0)
      : "0";
  return `You are CashBuddy AI, a personal financial advisor specialized in Nepal's economy and financial system. You are helping ${name}.

Current Financial Data:
- Total Balance: ${formatAmount(balance)}
- This Month Income: ${formatAmount(monthlyIncome)}
- This Month Expenses: ${formatAmount(monthlyExpenses)}
- Savings Rate: ${savingsRate}%
- Currency: Nepali Rupees (Rs./NPR)

Guidelines:
- Always respond in English but mention NPR/Rs. for amounts
- Give practical, actionable advice relevant to Nepal (mention NEPSE, NRB policies, local banks like NIC Asia, Everest Bank, etc.)
- Keep responses concise (3-5 sentences max) and conversational
- Reference the user's actual balance/spending data when relevant
- Suggest Nepal-specific investment options (NEPSE stocks, mutual funds, FD rates ~8-9%)
- Be encouraging and supportive
- If asked about something unrelated to finance, gently redirect to financial topics`;
}

const SUGGESTIONS = [
  "How's my financial health?",
  "Tips to save more this month",
  "Should I invest in NEPSE?",
  "How to build an emergency fund?",
  "Best banks in Nepal for savings?",
  "How to budget on Rs. 50,000/month?",
];

export default function AIChatScreen() {
  const insets = useSafeAreaInsets();
  const {
    chatHistory,
    addChatMessage,
    clearChatHistory,
    getBalance,
    getMonthlyIncome,
    getMonthlyExpenses,
    profile,
  } = useApp();
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const listRef = useRef<FlatList>(null);

  const topPadding = Platform.OS === "web" ? 67 : insets.top + 16;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  const handleSend = async (msg?: string) => {
    const text = (msg ?? input).trim();
    if (!text || isTyping) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInput("");

    addChatMessage({
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    });
    setIsTyping(true);

    const systemPrompt = buildSystemPrompt(
      getBalance(),
      getMonthlyIncome(),
      getMonthlyExpenses(),
      profile.name
    );

    const conversationMessages = [
      { role: "system", content: systemPrompt },
      ...chatHistory.slice(-8).map((m) => ({
        role: m.role,
        content: m.content,
      })),
      { role: "user", content: text },
    ];

    const response = await callOpenRouter(conversationMessages);

    addChatMessage({
      role: "assistant",
      content: response,
      timestamp: new Date().toISOString(),
    });
    setIsTyping(false);

    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === "user";
    return (
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.messageRow, isUser && styles.messageRowUser]}
      >
        {!isUser && (
          <View style={styles.botAvatar}>
            <Feather name="cpu" size={14} color={COLORS.primaryLight} />
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}>
          <Text style={[styles.bubbleText, isUser && styles.userBubbleText]}>
            {item.content}
          </Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#060D1F", "#0A1628"]} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.aiBadge}>
            <Feather name="cpu" size={14} color={COLORS.primaryLight} />
            <View style={styles.onlineDot} />
          </View>
          <View>
            <Text style={styles.headerTitle}>AI Financial Advisor</Text>
            <Text style={styles.headerSub}>
              {API_KEY ? "Powered by OpenRouter AI" : "Configure API Key to enable"}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={clearChatHistory} style={styles.clearBtn}>
          <Feather name="trash-2" size={18} color={COLORS.darkTextSecondary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          data={chatHistory}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            chatHistory.length === 0 ? (
              <WelcomeMessage
                hasKey={!!API_KEY}
                name={profile.name}
                onSuggest={handleSend}
              />
            ) : null
          }
          ListFooterComponent={
            isTyping ? (
              <View style={styles.typingRow}>
                <View style={styles.botAvatar}>
                  <Feather name="cpu" size={14} color={COLORS.primaryLight} />
                </View>
                <View style={styles.typingBubble}>
                  <TypingDots />
                </View>
              </View>
            ) : null
          }
        />

        {/* Suggestions strip */}
        {chatHistory.length === 0 && (
          <FlatList
            horizontal
            data={SUGGESTIONS}
            keyExtractor={(s) => s}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestions}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestion}
                onPress={() => handleSend(item)}
              >
                <Text style={styles.suggestionText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        )}

        {/* Input bar */}
        <View style={[styles.inputBar, { paddingBottom: bottomPadding + 8 }]}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask anything about your finances..."
            placeholderTextColor={COLORS.darkTextSecondary}
            multiline
            maxLength={500}
            editable={!isTyping}
          />
          <Pressable
            style={({ pressed }) => [
              styles.sendBtn,
              { opacity: pressed || !input.trim() || isTyping ? 0.5 : 1 },
            ]}
            onPress={() => handleSend()}
            disabled={!input.trim() || isTyping}
          >
            <LinearGradient
              colors={["#0D47A1", "#1565C0"]}
              style={styles.sendBtnGrad}
            >
              <Feather name="send" size={18} color={COLORS.white} />
            </LinearGradient>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function WelcomeMessage({
  hasKey,
  name,
  onSuggest,
}: {
  hasKey: boolean;
  name: string;
  onSuggest: (s: string) => void;
}) {
  return (
    <Animated.View entering={FadeInDown.duration(500)} style={wStyles.container}>
      <LinearGradient colors={["#0D47A1", "#1565C0"]} style={wStyles.iconContainer}>
        <Feather name="cpu" size={32} color={COLORS.white} />
      </LinearGradient>
      <Text style={wStyles.title}>CashBuddy AI</Text>
      <Text style={wStyles.subtitle}>
        {hasKey
          ? `Hi ${name.split(" ")[0]}! I'm your personal AI financial advisor for Nepal. Ask me anything about your money!`
          : "AI advisor is ready. Your API key is configured and I'm connected to OpenRouter."}
      </Text>
      {hasKey && (
        <View style={wStyles.poweredBy}>
          <Feather name="zap" size={11} color={COLORS.accent} />
          <Text style={wStyles.poweredByText}>Powered by OpenRouter · Mistral 7B</Text>
        </View>
      )}
    </Animated.View>
  );
}

function TypingDots() {
  return (
    <View style={{ flexDirection: "row", gap: 4, padding: 4 }}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: COLORS.primaryLight,
            opacity: 0.7,
          }}
        />
      ))}
    </View>
  );
}

const wStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
    gap: 12,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: { color: COLORS.white, fontSize: 22, fontFamily: "Inter_700Bold" },
  subtitle: {
    color: COLORS.darkTextSecondary,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  poweredBy: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: COLORS.accent + "18",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 4,
  },
  poweredByText: {
    color: COLORS.accent,
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.darkBg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.darkBorder,
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
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  aiBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight + "22",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    borderWidth: 1,
    borderColor: COLORS.primaryLight + "44",
  },
  onlineDot: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.darkBg,
  },
  headerTitle: { color: COLORS.white, fontSize: 16, fontFamily: "Inter_700Bold" },
  headerSub: { color: COLORS.success, fontSize: 11, fontFamily: "Inter_400Regular" },
  clearBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  listContent: { padding: 16, gap: 12, paddingBottom: 0 },
  messageRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginBottom: 8 },
  messageRowUser: { justifyContent: "flex-end" },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight + "22",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.primaryLight + "44",
  },
  bubble: { maxWidth: "75%", borderRadius: 18, padding: 14 },
  botBubble: {
    backgroundColor: COLORS.darkCard,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    borderBottomLeftRadius: 4,
  },
  userBubble: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  bubbleText: {
    color: COLORS.darkText,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  userBubbleText: { color: COLORS.white },
  typingRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginTop: 8, paddingHorizontal: 16 },
  typingBubble: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  suggestions: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  suggestion: {
    backgroundColor: COLORS.primary + "22",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.primary + "44",
  },
  suggestionText: { color: COLORS.primaryLight, fontSize: 13, fontFamily: "Inter_500Medium" },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.darkBorder,
    backgroundColor: COLORS.darkBg,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.darkCard,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: COLORS.white,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    maxHeight: 120,
  },
  sendBtn: { borderRadius: 20, overflow: "hidden" },
  sendBtnGrad: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
});
