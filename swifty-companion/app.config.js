export default {
  name: "SwiftyCompanion",
  slug: "swifty-companion",
  version: "1.0.0",
  orientation: "default",
  icon: "./assets/images/icon.png",
  scheme: "swiftycompanion",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,

  extra: {
    IP_ADDRESS: process.env.IP_ADDRESS || "localhost",
    PROJECT_LOCAL_API: process.env.PROJECT_LOCAL_API || "FALSE",
    PROJECT_LOCAL_API_PORT: process.env.PROJECT_LOCAL_API_PORT || 3000,
    PROJECT_API_URL:
      process.env.PROJECT_API_URL || "https://swifty-api.vercel.app/",
    eas: {
      projectId: "6b82f6c9-afb7-467f-ade4-ede7ace16ecf",
    },
  },

  ios: {
    supportsTablet: true,
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    package: "com.swiftycompanion.app",
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
      },
    ],
    "expo-font",
    "expo-secure-store",
    "expo-web-browser",
  ],
  experiments: {
    typedRoutes: true,
  },
  developer: {
    projectRoot: ".",
    tools: ["ios-simulator", "android-emulator"],
  },
  packagerOpts: {
    hostType: "lan",
    lanType: "ip",
  },
  updates: {
    url: "https://u.expo.dev/6b82f6c9-afb7-467f-ade4-ede7ace16ecf",
  },
  runtimeVersion: {
    policy: "appVersion",
  },
};
