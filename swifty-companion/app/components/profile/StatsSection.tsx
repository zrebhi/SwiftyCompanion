import { View, Text, StyleSheet } from "react-native";

interface StatsSectionProps {
  wallet: number;
  correctionPoints: number;
}

export const StatsSection = ({ wallet, correctionPoints }: StatsSectionProps) => {
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
    backgroundColor: "#1E1E1E",
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    color: "#bbb",
    fontSize: 12,
  },
  statValue: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 5,
  },
});

export default StatsSection;