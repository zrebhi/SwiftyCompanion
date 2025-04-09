import React from "react";
import { Text, StyleSheet } from "react-native";

/**
 * Renders an error message if validation fails
 *
 * @param props - Component props
 */
export const ErrorMessage = ({ error }: { error: string | undefined }) => {
  if (!error) return null;
  return <Text style={styles.errorText}>{error}</Text>;
};

const styles = StyleSheet.create({
  errorText: {
    color: "#ff6b6b",
    fontSize: 14,
    marginTop: 5,
    marginBottom: 5,
    textAlign: "center",
  },
});

export default ErrorMessage;