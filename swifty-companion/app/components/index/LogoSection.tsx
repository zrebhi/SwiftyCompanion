import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import colors from "@/constants/colors";

/**
 * Renders the app logo and title section
 */
export const LogoSection = () => (
  <View style={styles.logoContainer}>
    <Image
      source={require("../../../assets/images/42_logo_white.png")}
      style={styles.logo}
      resizeMode="contain"
    />
    <Text style={styles.title}>Swifty Companions</Text>
  </View>
);

const styles = StyleSheet.create({
  logoContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    width: "100%",
  },
  logo: {
    width: 150,
    height: 150,
    alignItems: "flex-start",
  },
  title: {
    fontSize: 35,
    color: "white",
    fontWeight: "bold",
  },
});

export default LogoSection;