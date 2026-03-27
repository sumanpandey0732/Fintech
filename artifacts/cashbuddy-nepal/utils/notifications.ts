import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
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

export async function scheduleDailyBalanceNotification(
  balance: number,
  name: string
): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    const granted = await requestNotificationPermission();
    if (!granted) return;

    await Notifications.cancelAllScheduledNotificationsAsync();

    const formattedBalance = `Rs. ${balance.toLocaleString("en-NP")}`;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Good morning, ${name.split(" ")[0]}! 💰`,
        body: `Your current balance is ${formattedBalance}. Have a great day tracking your finances!`,
        sound: false,
        data: { type: "daily_balance" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 8,
        minute: 0,
      },
    });
  } catch (e) {
    console.warn("Notification scheduling failed:", e);
  }
}

export async function sendInstantNotification(
  title: string,
  body: string
): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return;
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: false },
      trigger: null,
    });
  } catch (e) {}
}
