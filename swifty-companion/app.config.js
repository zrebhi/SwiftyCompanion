export default {
  name: "SwiftyCompanion",
  slug: "swifty-companion",
  version: "1.0.0",
  orientation: "default",
  icon: "./assets/images/icon.png",
  scheme: "swiftycompanion", // Add scheme here
  userInterfaceStyle: "automatic",
  newArchEnabled: true, // Add newArchEnabled here

  extra: {
    CLIENT_ID: process.env.CLIENT_ID,
    CLIENT_SECRET: process.env.CLIENT_SECRET,
    IP_ADDRESS: process.env.IP_ADDRESS,
    PROJECT_LOCAL_API: process.env.LOCAL_API,
    PROJECT_LOCAL_API_PORT: process.env.PROJECT_LOCAL_API_PORT,
    PROJECT_API_URL: process.env.VERCEL_API_URL,
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
