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
        : opts.balance < 10000
        ? "🔔 Balance getting low. Be mindful of spending."
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

    // 2. Midday balance check — 12:00 PM (NEW)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `📊 Midday Balance Update`,
        body: `Current balance: ${balFmt}. ${opts.balance < 5000 ? "Consider limiting spending today!" : "Looking good!"}`,
        data: { type: "midday_balance" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 12,
        minute: 0,
      },
    });

    // 3. Afternoon check-in reminder — 3:00 PM (Changed from 1 PM)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `💰 Afternoon Financial Check`,
        body: `Don't forget to log your expenses! Balance: ${balFmt}`,
        data: { type: "afternoon_checkin" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 15,
        minute: 0,
      },
    });

    // 4. Evening spending recap — 9:00 PM
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🌙 Daily Spending Recap`,
        body:
          opts.todayExpenses > 0
            ? `You spent ${expFmt} today. Balance: ${balFmt}. Tap to review.`
            : `No spending logged today, ${firstName}! Great discipline 💪`,
        data: { type: "evening_recap" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 21,
        minute: 0,
      },
    });

    // 5. Weekly summary — every Sunday 8:00 PM
    const weekFmt = `Rs. ${opts.weeklyExpenses.toLocaleString("en-NP")}`;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `📅 Weekly Financial Summary`,
        body: `This week you spent ${weekFmt}. Current balance: ${balFmt}`,
        data: { type: "weekly_summary" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: 1,
        hour: 20,
        minute: 0,
      },
    });

    // 6. Streak motivator — only if streak >= 3
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

    // 7. Low balance alerts — schedule daily if balance is low
    if (opts.balance < 5000 && opts.balance >= 0) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `🔔 Low Balance Alert`,
          body: `Your balance is Rs. ${opts.balance.toLocaleString("en-NP")}. Consider reducing expenses today.`,
          data: { type: "low_balance_daily" },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 10,
          minute: 30,
        },
      });

      // Extra reminder in the evening
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `⚠️ Balance Reminder`,
          body: `Balance: ${balFmt}. Avoid unnecessary purchases until income arrives.`,
          data: { type: "low_balance_evening" },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 18,
          minute: 0,
        },
      });
    }

    // 8. Critical balance alerts — if balance is negative
    if (opts.balance < 0) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `🚨 Negative Balance Alert`,
          body: `Your balance is ${balFmt}. Stop all non-essential spending immediately!`,
          data: { type: "critical_balance" },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 9,
          minute: 0,
        },
      });

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `⛔ Balance Critical`,
          body: `You're Rs. ${Math.abs(opts.balance).toLocaleString("en-NP")} in debt. Review expenses now!`,
          data: { type: "critical_balance_afternoon" },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 14,
          minute: 0,
        },
      });
    }

    // 9. Budget overspend alerts — immediate if any category > 80%
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
  } catch (e) {
    console.warn("Instant notification failed:", e);
  }
}

export async function sendLowBalanceAlert(
  balance: number,
  severity: "low" | "critical"
): Promise<void> {
  const balFmt = `Rs. ${Math.abs(balance).toLocaleString("en-NP")}`;
  
  if (severity === "critical") {
    await sendInstantNotification(
      `🚨 Critical Balance Alert!`,
      balance < 0 
        ? `You're ${balFmt} in debt! Stop all spending immediately.`
        : `Balance critically low: ${balFmt}. Avoid all non-essential expenses!`,
      { type: "critical_balance_instant" }
    );
  } else {
    await sendInstantNotification(
      `🔔 Low Balance Warning`,
      `Your balance dropped to ${balFmt}. Be careful with spending today.`,
      { type: "low_balance_instant" }
    );
  }
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

export async function sendDailySummaryNotification(
  balance: number,
  todaySpent: number,
  todayIncome: number
): Promise<void> {
  const balFmt = `Rs. ${balance.toLocaleString("en-NP")}`;
  const spentFmt = `Rs. ${todaySpent.toLocaleString("en-NP")}`;
  const incomeFmt = `Rs. ${todayIncome.toLocaleString("en-NP")}`;
  
  let message = `Balance: ${balFmt}`;
  if (todaySpent > 0) message += ` | Spent: ${spentFmt}`;
  if (todayIncome > 0) message += ` | Earned: ${incomeFmt}`;
  
  await sendInstantNotification(
    `📊 Daily Financial Update`,
    message,
    { type: "daily_summary" }
  );
}

export async function sendSavingsTip(): Promise<void> {
  const tips = [
    "💡 Tip: Track every small expense - they add up quickly!",
    "💡 Tip: Set a daily spending limit and stick to it.",
    "💡 Tip: Review your expenses weekly to find patterns.",
    "💡 Tip: Use the 24-hour rule before making non-essential purchases.",
    "💡 Tip: Cook at home more - restaurant expenses add up fast!",
    "💡 Tip: Set specific savings goals to stay motivated.",
    "💡 Tip: Automate your savings by paying yourself first.",
    "💡 Tip: Avoid impulse purchases - wait before buying.",
  ];
  
  const randomTip = tips[Math.floor(Math.random() * tips.length)];
  await sendInstantNotification(
    `💰 CashBuddy Tip`,
    randomTip,
    { type: "savings_tip" }
  );
}
