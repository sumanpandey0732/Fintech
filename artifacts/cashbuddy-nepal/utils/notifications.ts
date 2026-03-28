import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function scheduleAllNotifications(opts: {
  balance: number;
  name: string;
  todayExpenses: number;
  weeklyExpenses: number;
  streak: number;
  budgetAlerts: { category: string; percent: number }[];
}): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return;

    await Notifications.cancelAllScheduledNotificationsAsync();

    const firstName = opts.name.split(" ")[0] || "there";
    const balFmt = `Rs. ${opts.balance.toLocaleString("en-NP")}`;
    const expFmt = `Rs. ${opts.todayExpenses.toLocaleString("en-NP")}`;

    const balanceTip =
      opts.balance < 0
        ? "⚠️ You're in the red — time to cut spending!"
        : opts.balance < 5000
        ? "💡 Balance is low. Avoid non-essentials today."
        : "✅ Balance looks healthy. Keep it up!";

    // 1. Daily morning balance reminder — 8:00 AM
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `☀️ Good morning, ${firstName}!`,
        body: `Balance: ${balFmt}  |  ${balanceTip}`,
        data: { type: "morning_balance" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 8,
        minute: 0,
      },
    });

    // 2. Evening spending recap — 9:00 PM
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🌙 Daily Spending Recap`,
        body:
          opts.todayExpenses > 0
            ? `You spent ${expFmt} today. Tap to review your transactions.`
            : `No spending logged today, ${firstName}! Great discipline 💪`,
        data: { type: "evening_recap" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 21,
        minute: 0,
      },
    });

    // 3. Midday check-in reminder — 1:00 PM
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `📊 Midday Check-in`,
        body: `Log your expenses before you forget! Staying consistent builds your streak.`,
        data: { type: "midday_checkin" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 13,
        minute: 0,
      },
    });

    // 4. Weekly summary — every Sunday 8:00 PM
    const weekFmt = `Rs. ${opts.weeklyExpenses.toLocaleString("en-NP")}`;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `📅 Weekly Financial Summary`,
        body: `This week you spent ${weekFmt}. Open CashBuddy to see your full report.`,
        data: { type: "weekly_summary" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: 1,
        hour: 20,
        minute: 0,
      },
    });

    // 5. Streak motivator — only if streak >= 3
    if (opts.streak >= 3) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `🔥 ${opts.streak}-Day Streak!`,
          body: `You're on a roll, ${firstName}! Keep logging daily to maintain your streak.`,
          data: { type: "streak_motivator" },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 19,
          minute: 30,
        },
      });
    }

    // 6. Budget overspend alerts — immediate if any category > 80%
    for (const alert of opts.budgetAlerts.slice(0, 2)) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `⚠️ Budget Alert: ${alert.category}`,
          body: `You've used ${alert.percent}% of your ${alert.category} budget. Watch your spending!`,
          data: { type: "budget_alert", category: alert.category },
        },
        trigger: null,
      });
    }
  } catch (e) {
    console.warn("Notification scheduling failed:", e);
  }
}

export async function sendInstantNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return;
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data: data ?? {} },
      trigger: null,
    });
  } catch (e) {}
}

export async function sendBudgetOverspendAlert(
  category: string,
  spentPercent: number
): Promise<void> {
  await sendInstantNotification(
    `🚨 Budget Exceeded: ${category}`,
    `You've spent ${spentPercent}% of your ${category} budget this month!`,
    { type: "budget_overspend", category }
  );
}

export async function sendGoalReachedAlert(goalTitle: string): Promise<void> {
  await sendInstantNotification(
    `🎉 Goal Reached!`,
    `Congratulations! You've hit your "${goalTitle}" savings goal!`,
    { type: "goal_reached", goal: goalTitle }
  );
}

export async function sendTransactionConfirmation(
  type: "income" | "expense",
  amount: number,
  category: string
): Promise<void> {
  const emoji = type === "income" ? "💚" : "💸";
  const label = type === "income" ? "Income" : "Expense";
  await sendInstantNotification(
    `${emoji} ${label} Logged`,
    `Rs. ${amount.toLocaleString("en-NP")} — ${category}`,
    { type: "transaction_confirm" }
  );
}
