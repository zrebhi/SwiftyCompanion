import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

/**
 * Props for the ErrorDisplay component.
 * @interface ErrorDisplayProps
 * @property {string} message - The error message to display.
 * @property {() => void} [onRetry] - Optional callback function to execute when the retry button is pressed.
 * @property {() => void} onBack - Callback function to execute when the back button is pressed.
 */
interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
  onBack: () => void;
}

/**
 * A component to display an error message with optional retry and back buttons.
 *
 * @param {ErrorDisplayProps} props - The props for the component.
 * @param {string} props.message - The error message text.
 * @param {() => void} [props.onRetry] - Optional handler for the retry action.
 * @param {() => void} props.onBack - Handler for the back action.
 * @returns {JSX.Element} The rendered error display component.
 */
export const ErrorDisplay = ({ message, onRetry, onBack }: ErrorDisplayProps) => {
  return (
    <View style={styles.errorContainer}>
      <FontAwesome name="exclamation-circle" size={50} color="#F44336" />
      <Text style={styles.errorText}>{message}</Text>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>Back to Search</Text>
      </TouchableOpacity>
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.backButtonText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      },
      errorText: {
        color: "#F44336",
        fontSize: 16,
        textAlign: "center",
        marginTop: 20,
      },
      backButton: {
        marginTop: 20,
        backgroundColor: "#2196F3",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
      },
      backButtonText: {
        color: "#fff",
        fontSize: 16,
      },
      retryButton: {
        marginTop: 10,
        backgroundColor: "#4CAF50",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
      }
});

export default ErrorDisplay;
