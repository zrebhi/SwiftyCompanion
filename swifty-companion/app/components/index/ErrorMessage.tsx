import React from "react";
import { Text, StyleSheet } from "react-native";

/**
 * Displays a styled error message text.
 * Renders nothing if the error prop is null or undefined.
 *
 * @param {object} props - Component props.
 * @param {string | undefined} props.error - The error message string to display. If undefined or null, the component returns null.
 * @returns {JSX.Element | null} The rendered error message text component or null.
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
