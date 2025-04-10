import { View, Text, StyleSheet } from "react-native";
import colors from "@/constants/colors";

/**
 * Props for the StatsSection component
 *
 * @interface StatsSectionProps
 * @property {number} wallet - The user's wallet balance
 * @property {number} correctionPoints - The user's evaluation/correction points
 */
interface StatsSectionProps {
  wallet: number;
  correctionPoints: number;
}

/**
 * StatsSection Component
 *
 * Displays the user's key metrics in a horizontal layout:
 * - Wallet balance (in-school currency)
 * - Evaluation/Correction points (used for peer evaluations)
 *
 * @param {StatsSectionProps} props - The component props
 * @param {number} props.wallet - The user's wallet balance
 * @param {number} props.correctionPoints - The user's evaluation points
 * @returns {JSX.Element} The rendered stats section component
 */
export const StatsSection = ({
  wallet,
  correctionPoints,
}: StatsSectionProps) => {
  return (
    <View style={styles.statsContainer}>
      <View style={styles.statItem}>
        <Text style={styles.statLabel}>Wallet</Text>
        <Text style={styles.statValue}>{wallet || 0}</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statLabel}>Evaluation Points</Text>
        <Text style={styles.statValue}>{correctionPoints || 0}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  statsContainer: {
    flexDirection: "row",
    padding: 20,
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    color: colors.text.secondary,
    fontSize: 12,
  },
  statValue: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 5,
  },
});

export default StatsSection;
