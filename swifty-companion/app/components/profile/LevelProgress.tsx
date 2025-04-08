/**
 * Displays a level progress bar with current level and percentage to next level
 */

import { View, Text, StyleSheet } from "react-native";

interface LevelProgressProps {
  level: number;
}

export const LevelProgress = ({ level }: LevelProgressProps) => {
  const currentLevel = Math.floor(level);
  const percentage = Math.round((level - currentLevel) * 100);

  return (
    <View style={styles.levelContainer}>
      <View style={styles.levelInfo}>
        <Text style={styles.levelLabel}>Level </Text>
        <Text style={styles.levelValue}>{currentLevel} </Text>
        <Text style={styles.percentText}>({percentage}%)</Text>
      </View>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${percentage}%` }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  levelContainer: {
    backgroundColor: "#1E1E1E",
    paddingHorizontal: 15,
    paddingTop: 10,
    marginTop: 20,
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: "#333",
    borderRadius: 5,
    width: "100%",
    marginTop: 8,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#2196F3",
    borderRadius: 5,
  },
  levelInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  levelLabel: {
    color: "#bbb",
    fontSize: 16,
  },
  levelValue: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  percentText: {
    color: "#64B5F6",
    fontSize: 16,
    fontWeight: "normal",
  },
});

export default LevelProgress;