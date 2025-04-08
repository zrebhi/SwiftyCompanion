import { View, Text, StyleSheet } from "react-native";
import usePagination from "../../hooks/usePagination";
import { PaginationControls } from "../common/PaginationControls";

interface Skill {
  id: number;
  name: string;
  level: number;
}

interface SkillsListProps {
  skills: Skill[];
}

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
    <View style={styles.sectionContainer}>
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
  sectionContainer: {
    backgroundColor: "#1E1E1E",
    padding: 15,
    marginVertical: 10,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  skillsContainer: {
    marginTop: 10,
  },
  skillItem: {
    marginBottom: 12,
  },
  skillName: {
    color: "#ddd",
    fontSize: 14,
  },
  skillLevelContainer: {
    height: 8,
    backgroundColor: "#333",
    borderRadius: 4,
    overflow: "hidden",
    position: "relative",
  },
  skillLevelBar: {
    position: "absolute",
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 4,
  },
  skillLevelText: {
    color: "#ddd",
    fontSize: 12,
  },
  skillLevelLine: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

export default SkillsList;
