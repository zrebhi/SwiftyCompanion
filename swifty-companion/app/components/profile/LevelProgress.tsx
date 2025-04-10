/**
 * LevelProgress Component
 *
 * Displays a level progress bar with current level and percentage to next level.
 * In the 42 system, levels are floating point numbers (e.g., 10.65) where the integer part
 * represents the current level and the decimal part represents progress to the next level.
 */

import { View, Text, StyleSheet } from "react-native";
import colors from "@/constants/colors";

/**
 * Props for the LevelProgress component
 *
 * @interface LevelProgressProps
 * @property {number} level - The user's current level (floating point number)
 */
interface LevelProgressProps {
  level: number;
}

/**
 * Displays a visual representation of the user's level progress
 *
 * Features:
 * - Shows integer level (e.g., "Level 10")
 * - Shows percentage to next level (e.g., "65%")
 * - Visual progress bar indicating progress toward next level
 *
 * @param {LevelProgressProps} props - The component props
 * @param {number} props.level - The user's current level value (e.g., 10.65)
 * @returns {JSX.Element} The rendered level progress component
 */
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
    paddingHorizontal: 15,
    paddingTop: 10,
    marginTop: 20,
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: colors.progress.background,
    borderRadius: 5,
    width: "100%",
    marginTop: 8,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: colors.progress.level,
    borderRadius: 5,
  },
  levelInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  levelLabel: {
    color: colors.text.secondary,
    fontSize: 16,
  },
  levelValue: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: "bold",
  },
  percentText: {
    color: colors.accent.percentage,
    fontSize: 16,
    fontWeight: "normal",
  },
});

export default LevelProgress;
