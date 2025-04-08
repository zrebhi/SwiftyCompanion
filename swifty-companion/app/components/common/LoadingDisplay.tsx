import { View, Text, StyleSheet, ActivityIndicator } from "react-native";

interface LoadingDisplayProps {
  message?: string;
}

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