import { Feather } from "@expo/vector-icons";
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
import Animated, {
  FadeIn,
  FadeInDown,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import COLORS from "@/constants/colors";
import { formatAmount } from "@/constants/categories";
import { ChatMessage, useApp } from "@/context/AppContext";

function generateAIResponse(
  message: string,
  balance: number,
  monthlyExpenses: number,
  monthlyIncome: number
): string {
  const savings = monthlyIncome - monthlyExpenses;
  const savingsRate = monthlyIncome > 0 ? (savings / monthlyIncome) * 100 : 0;
  const lowerMsg = message.toLowerCase();

  if (lowerMsg.includes("bike") || lowerMsg.includes("motorcycle")) {
    const bikePrice = 200000;
    const months = balance >= bikePrice ? 0 : Math.ceil((bikePrice - balance) / Math.max(savings, 1000));
    if (balance >= bikePrice) {
      return `Based on your current balance of ${formatAmount(balance)}, you can afford a bike right now! However, I recommend keeping at least Rs. 20,000 as emergency funds. Consider going for it if you've planned for fuel and maintenance costs.`;
    }
    return `You currently have ${formatAmount(balance)} saved. A standard bike costs around Rs. 2 lakhs. At your current savings rate of ${formatAmount(savings)}/month, you'd need ${months} months to save up. Try setting a specific "Bike Fund" goal in the Goals tab!`;
  }

  if (lowerMsg.includes("save") && (lowerMsg.includes("5000") || lowerMsg.includes("rs."))) {
    return `Great question! Here are 5 quick ways to save Rs. 5000:\n\n1. Cut dining out twice/week (Rs. 1,500)\n2. Use public transport (Rs. 800)\n3. Cancel unused subscriptions (Rs. 500)\n4. Cook at home more (Rs. 2,000)\n5. Avoid impulse shopping (Rs. 500)\n\nWith your current spending habits, this is very achievable within 1-2 weeks!`;
  }

  if (lowerMsg.includes("overspend") || lowerMsg.includes("spending too much")) {
    const topCategory = monthlyExpenses > 0 ? "food & dining" : "various categories";
    return `Based on your transactions, you're spending most on ${topCategory} this month. Your expenses are ${formatAmount(monthlyExpenses)} vs income of ${formatAmount(monthlyIncome)}. ${savingsRate < 20 ? "I recommend targeting a 20% savings rate. Try the 50-30-20 rule: 50% needs, 30% wants, 20% savings." : "You're doing well! Keep it up!"}`;
  }

  if (lowerMsg.includes("balance") || lowerMsg.includes("how much")) {
    return `Your current total balance is ${formatAmount(balance)}. This month you've earned ${formatAmount(monthlyIncome)} and spent ${formatAmount(monthlyExpenses)}. Your savings rate is ${savingsRate.toFixed(0)}%. ${savingsRate >= 20 ? "Excellent financial health!" : "Consider reducing expenses to increase your savings rate above 20%."}`;
  }

  if (lowerMsg.includes("budget")) {
    return `Smart budgeting tip for Nepal:\n\n• Rent/Housing: 30% of income (${formatAmount(monthlyIncome * 0.3)})\n• Food: 20% (${formatAmount(monthlyIncome * 0.2)})\n• Transport: 10% (${formatAmount(monthlyIncome * 0.1)})\n• Savings: 20% (${formatAmount(monthlyIncome * 0.2)})\n• Entertainment: 10% (${formatAmount(monthlyIncome * 0.1)})\n• Other: 10% (${formatAmount(monthlyIncome * 0.1)})\n\nSet these limits in the Budget section!`;
  }

  if (lowerMsg.includes("invest") || lowerMsg.includes("stock") || lowerMsg.includes("nepse")) {
    return `Investment tips for Nepal:\n\n1. NEPSE (Nepal Stock Exchange) - Start with Rs. 10,000\n2. Mutual Funds (NMB, Global IME) - Low risk\n3. Fixed Deposits - Safe, 8-9% annual return\n4. Real Estate in growing areas\n\nI recommend keeping 6 months expenses (${formatAmount(monthlyExpenses * 6)}) as emergency fund before investing. Your current balance allows for smart investments!`;
  }

  if (lowerMsg.includes("predict") || lowerMsg.includes("future") || lowerMsg.includes("next month")) {
    const predictedBalance = balance + savings;
    return `Based on your current trend:\n\n• Expected income next month: ${formatAmount(monthlyIncome)}\n• Expected expenses: ${formatAmount(monthlyExpenses)}\n• Predicted balance: ${formatAmount(predictedBalance)}\n\n${predictedBalance > balance ? "Your balance should grow next month! Keep it up." : "Warning: Your expenses may exceed income. Review your spending."}`;
  }

  const responses = [
    `Your financial health looks ${savingsRate >= 20 ? "great" : "okay"}! With ${formatAmount(balance)} balance and ${savingsRate.toFixed(0)}% savings rate this month, ${savingsRate >= 20 ? "you're on track for financial independence!" : "focus on increasing your savings to at least 20%."}`,
    `Quick tip: For every Rs. 100 you earn, try to save Rs. 20. Currently you're saving ${formatAmount(savings)}/month. Set up automatic transfers to a savings account on payday!`,
    `I analyzed your spending patterns. You could save an extra Rs. ${Math.round(monthlyExpenses * 0.1).toLocaleString()} per month by reducing discretionary spending by just 10%. Would you like specific suggestions?`,
    `Did you know? Investing in a SIP (Systematic Investment Plan) of just Rs. 5,000/month can grow to Rs. 10 lakhs in 10 years at 12% annual return. Nepal has great mutual fund options!`,
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}

const SUGGESTIONS = [
  "Can I afford a bike?",
  "How to save Rs. 5000 fast?",
  "Am I overspending?",
  "What's my balance?",
  "Give me a budget plan",
  "Investment tips for Nepal",
  "Predict next month's balance",
];

export default function AIChatScreen() {
  const insets = useSafeAreaInsets();
  const { chatHistory, addChatMessage, clearChatHistory, getBalance, getMonthlyIncome, getMonthlyExpenses } = useApp();
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const listRef = useRef<FlatList>(null);

  const topPadding = Platform.OS === "web" ? 67 : insets.top + 16;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  const handleSend = async (msg?: string) => {
    const text = (msg ?? input).trim();
    if (!text) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInput("");

    addChatMessage({ role: "user", content: text, timestamp: new Date().toISOString() });
    setIsTyping(true);

    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));

    const response = generateAIResponse(
      text,
      getBalance(),
      getMonthlyExpenses(),
      getMonthlyIncome()
    );

    addChatMessage({ role: "assistant", content: response, timestamp: new Date().toISOString() });
    setIsTyping(false);

    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 100);
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
      <LinearGradient
        colors={["#060D1F", "#0A1628"]}
        style={StyleSheet.absoluteFill}
      />

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
            <Text style={styles.headerSub}>Online • Nepal Expert</Text>
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
              <WelcomeMessage onSuggest={handleSend} />
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

        {/* Suggestions */}
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

        {/* Input */}
        <View style={[styles.inputBar, { paddingBottom: bottomPadding + 8 }]}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask your financial question..."
            placeholderTextColor={COLORS.darkTextSecondary}
            multiline
            maxLength={500}
          />
          <Pressable
            style={({ pressed }) => [
              styles.sendBtn,
              { opacity: pressed || !input.trim() ? 0.6 : 1 },
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

function WelcomeMessage({ onSuggest }: { onSuggest: (s: string) => void }) {
  return (
    <Animated.View entering={FadeInDown.duration(500)} style={wStyles.container}>
      <LinearGradient
        colors={["#0D47A1", "#1565C0"]}
        style={wStyles.iconContainer}
      >
        <Feather name="cpu" size={32} color={COLORS.white} />
      </LinearGradient>
      <Text style={wStyles.title}>CashBuddy AI</Text>
      <Text style={wStyles.subtitle}>
        Your personal financial advisor for Nepal. Ask me anything about your finances!
      </Text>
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
  title: {
    color: COLORS.white,
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    color: COLORS.darkTextSecondary,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
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
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
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
  headerTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  headerSub: {
    color: COLORS.success,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  clearBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 0,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 8,
  },
  messageRowUser: {
    justifyContent: "flex-end",
  },
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
  bubble: {
    maxWidth: "75%",
    borderRadius: 18,
    padding: 14,
  },
  botBubble: {
    backgroundColor: COLORS.darkCard,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    color: COLORS.darkText,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  userBubbleText: {
    color: COLORS.white,
  },
  typingRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginTop: 8,
  },
  typingBubble: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  suggestions: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  suggestion: {
    backgroundColor: COLORS.primary + "22",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.primary + "44",
  },
  suggestionText: {
    color: COLORS.primaryLight,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
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
  sendBtn: {
    borderRadius: 20,
    overflow: "hidden",
  },
  sendBtnGrad: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
});
