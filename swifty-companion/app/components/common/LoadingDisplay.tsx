import { View, Text, StyleSheet, ActivityIndicator } from "react-native";

/**
 * Props for the LoadingDisplay component.
 * @interface LoadingDisplayProps
 * @property {string} [message="Loading..."] - Optional message to display below the indicator. Defaults to "Loading...".
 */
interface LoadingDisplayProps {
  message?: string;
}

/**
 * A component to display a loading indicator with an optional message.
 *
 * @param {LoadingDisplayProps} props - The props for the component.
 * @param {string} [props.message="Loading..."] - The message to display.
 * @returns {JSX.Element} The rendered loading display component.
 */
export const LoadingDisplay = ({ message = "Loading..." }: LoadingDisplayProps) => {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#42A5F5" />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    marginTop: 10,
  }
});

export default LoadingDisplay;
