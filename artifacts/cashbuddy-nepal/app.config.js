export default {
  expo: {
    name: "CashBuddy Nepal Pro",
    slug: "cashbuddy-nepal",
    owner: "idkfuckyou",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "cashbuddy-nepal",
    userInterfaceStyle: "dark",
    newArchEnabled: true,
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#060D1F",
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.santoshpandey.cashbuddynepal",
    },
    android: {
      backgroundColor: "#060D1F",
      package: "com.santoshpandey.cashbuddynepal",
    },
    web: {
      favicon: "./assets/images/icon.png",
    },
    plugins: [
      [
        "expo-router",
        {
          origin: "https://replit.com/",
        },
      ],
      "expo-font",
      "expo-web-browser",
      [
        "expo-notifications",
        {
          icon: "./assets/images/icon.png",
          color: "#060D1F",
          sounds: [],
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      apiKey: process.env.API_KEY || "",
      eas: {
        projectId: "9124ed85-1afb-48ca-8b54-3b70148083c6",
      },
    },
  },
};
