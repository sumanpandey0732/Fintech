import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider, useApp } from "@/context/AppContext";
import { CATEGORY_CONFIG } from "@/constants/categories";
import { scheduleAllNotifications } from "@/utils/notifications";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function NotificationSetup() {
  const { profile, getBalance, getMonthlyExpenses, transactions, budgets } = useApp();

  useEffect(() => {
    if (!profile.isOnboarded || !profile.name) return;

    const balance = getBalance();
    const monthlyExpenses = getMonthlyExpenses();

    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const weeklyExpenses = transactions
      .filter((t) => t.type === "expense" && new Date(t.date) >= sevenDaysAgo)
      .reduce((s, t) => s + t.amount, 0);

    const budgetAlerts = budgets
      .filter((b) => b.limit > 0 && b.spent / b.limit >= 0.8)
      .map((b) => ({
        category: CATEGORY_CONFIG[b.category]?.label ?? b.category,
        percent: Math.round((b.spent / b.limit) * 100),
      }));

    scheduleAllNotifications({
      balance,
      name: profile.name,
      todayExpenses: transactions
        .filter((t) => t.type === "expense" && t.date.slice(0, 10) === now.toISOString().slice(0, 10))
        .reduce((s, t) => s + t.amount, 0),
      weeklyExpenses,
      streak: profile.streak,
      budgetAlerts,
    });
  }, [profile.isOnboarded, profile.name, profile.streak, transactions.length, budgets.length]);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AppProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <NotificationSetup />
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="index" options={{ headerShown: false }} />
                  <Stack.Screen name="onboarding" options={{ headerShown: false }} />
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="add-transaction" options={{ presentation: "modal", headerShown: false }} />
                  <Stack.Screen name="transaction-detail" options={{ presentation: "modal", headerShown: false }} />
                  <Stack.Screen name="ai-chat" options={{ presentation: "modal", headerShown: false }} />
                  <Stack.Screen name="budget-setup" options={{ presentation: "modal", headerShown: false }} />
                  <Stack.Screen name="add-goal" options={{ presentation: "modal", headerShown: false }} />
                </Stack>
              </KeyboardProvider>
            </GestureHandlerRootView>
          </AppProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
