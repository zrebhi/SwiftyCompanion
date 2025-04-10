import { View, Text, StyleSheet } from "react-native";
import usePagination from "../../hooks/usePagination";
import { PaginationControls } from "../common/PaginationControls";
import colors from "@/constants/colors";

/**
 * Represents a user skill from the 42 API
 *
 * @interface Skill
 * @property {number} id - The unique identifier of the skill
 * @property {string} name - The name of the skill (e.g., "Unix", "Algorithms & AI", etc.)
 * @property {number} level - The user's proficiency level in the skill (0-21)
 */
interface Skill {
  id: number;
  name: string;
  level: number;
}

/**
 * Props for the SkillsList component
 *
 * @interface SkillsListProps
 * @property {Skill[]} skills - Array of skills to display
 */
interface SkillsListProps {
  skills: Skill[];
}

/**
 * SkillsList Component
 *
 * Displays a user's skills with visual progress bars and pagination controls.
 * Skills are sorted by level (highest first) and displayed with:
 * - Skill name
 * - Numeric level value
 * - Visual progress bar representing level
 *
 * @param {SkillsListProps} props - The component props
 * @param {Skill[]} props.skills - Array of skills to display
 * @returns {JSX.Element} The rendered skills list component
 */
export const SkillsList = ({ skills }: SkillsListProps) => {
  const sortedSkills = [...skills].sort((a, b) => b.level - a.level);

  const {
    currentItems: currentSkills,
    currentPage,
    totalPages,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPreviousPage,
  } = usePagination(sortedSkills, 5);

  return (
    <View style={styles.skillsListContainer}>
      <Text style={styles.sectionTitle}>Skills</Text>
      <View style={styles.skillsContainer}>
        {currentSkills.map((skill) => (
          <View key={skill.id} style={styles.skillItem}>
            <View style={styles.skillLevelLine}>
              <Text style={styles.skillName}>{skill.name}</Text>
              <Text style={styles.skillLevelText}>
                {skill.level.toFixed(2)}
              </Text>
            </View>
            <View style={styles.skillLevelContainer}>
              <View
                style={[
                  styles.skillLevelBar,
                  { width: `${Math.min(skill.level * 10, 100)}%` },
                ]}
              />
            </View>
          </View>
        ))}
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          goToFirstPage={goToFirstPage}
          goToLastPage={goToLastPage}
          goToNextPage={goToNextPage}
          goToPreviousPage={goToPreviousPage}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skillsListContainer: {
    padding: 20,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  skillsContainer: {
    marginTop: 10,
  },
  skillItem: {
    marginBottom: 12,
  },
  skillName: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  skillLevelContainer: {
    height: 8,
    backgroundColor: colors.progress.background,
    borderRadius: 4,
    overflow: "hidden",
    position: "relative",
  },
  skillLevelBar: {
    position: "absolute",
    height: "100%",
    backgroundColor: colors.progress.skill,
    borderRadius: 4,
  },
  skillLevelText: {
    color: colors.text.secondary,
    fontSize: 12,
  },
  skillLevelLine: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

export default SkillsList;
