import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import COLORS from "@/constants/colors";
import { useApp } from "@/context/AppContext";

export default function Index() {
  const { profile, isLoading } = useApp();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.darkBg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={COLORS.primaryLight} size="large" />
      </View>
    );
  }

  if (!profile.isOnboarded) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}
