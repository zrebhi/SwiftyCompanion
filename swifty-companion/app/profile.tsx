/**
 * Profile Screen Component
 *
 * Displays detailed information about a 42 student profile including:
 * - Basic user info (image, name, email)
 * - Level progress
 * - Skills
 * - Projects
 */
import { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  StatusBar,
} from "react-native";
// @ts-expect-error - Expo Router types issue
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import userService from "../services/userService";
import { TouchableOpacity } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

import { UserDetail } from "../services/userService";

/**
 * Gets the main cursus (educational program) from the user's cursus list
 * Returns the main cursus if found, otherwise returns the one with highest level
 */
const getMainCursus = (cursusUsers: any[]) => {
  if (!cursusUsers?.length) return null;

  const mainCursus = cursusUsers.find((cu) => cu.cursus?.kind === "main");

  return mainCursus || cursusUsers.sort((a, b) => b.level - a.level)[0];
};

/**
 * Displays a level progress bar with current level and percentage to next level
 */
const LevelProgress = ({ level }: { level: number }) => {
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

const usePagination = <T,>(items: T[], itemsPerPage: number = 5) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(items.length / itemsPerPage);

  const currentItems = items.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToFirstPage = () => {
    setCurrentPage(1);
  };

  const goToLastPage = () => {
    setCurrentPage(totalPages);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((current) => current - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((current) => current + 1);
    }
  };

  const PaginationControls = () => {
    if (totalPages <= 1) return null;

    return (
      <View style={styles.paginationContainer}>
        {/* First page button */}
        {totalPages > 3 && (
          <TouchableOpacity
            onPress={goToFirstPage}
            disabled={currentPage === 1}
            style={[
              styles.paginationButton,
              currentPage === 1 && styles.paginationButtonDisabled,
            ]}
          >
            <FontAwesome
              name="angle-double-left"
              size={18}
              color={currentPage === 1 ? "#666" : "#fff"}
            />
          </TouchableOpacity>
        )}
        {/* Previous page button */}
        <TouchableOpacity
          onPress={goToPreviousPage}
          disabled={currentPage === 1}
          style={[
            styles.paginationButton,
            currentPage === 1 && styles.paginationButtonDisabled,
          ]}
        >
          <FontAwesome
            name="chevron-left"
            size={10}
            color={currentPage === 1 ? "#666" : "#fff"}
          />
        </TouchableOpacity>

        {/* Page indicator */}
        <Text style={styles.paginationText}>
          {currentPage}/{totalPages}
        </Text>

        {/* Next page button */}
        <TouchableOpacity
          onPress={goToNextPage}
          disabled={currentPage === totalPages}
          style={[
            styles.paginationButton,
            currentPage === totalPages && styles.paginationButtonDisabled,
          ]}
        >
          <FontAwesome
            name="chevron-right"
            size={10}
            color={currentPage === totalPages ? "#666" : "#fff"}
          />
        </TouchableOpacity>

        {/* Last page button */}
        {totalPages > 3 && (
          <TouchableOpacity
            onPress={goToLastPage}
            disabled={currentPage === totalPages}
            style={[
              styles.paginationButton,
              currentPage === totalPages && styles.paginationButtonDisabled,
            ]}
          >
            <FontAwesome
              name="angle-double-right"
              size={18}
              color={currentPage === totalPages ? "#666" : "#fff"}
            />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return {
    currentItems,
    currentPage,
    totalPages,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPreviousPage,
    PaginationControls,
  };
};

/**
 * Displays a list of user skills with progress bars and pagination
 */
const SkillsList = ({ skills }: { skills: any[] }) => {
  // Sort skills by level (highest first)
  const sortedSkills = [...skills].sort((a, b) => b.level - a.level);

  // Use the pagination hook
  const { currentItems: currentSkills, PaginationControls } = usePagination(
    sortedSkills,
    5
  );

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

        {/* Use the pagination controls from the hook */}
        <PaginationControls />
      </View>
    </View>
  );
};

const ProjectsList = ({ projects }: { projects: any[] }) => {
  // Filter projects by status
  const completedProjects = projects.filter(
    (p) => p.status === "finished" && p["validated?"] === true
  );
  const failedProjects = projects.filter(
    (p) => p.status === "finished" && p["validated?"] === false
  );
  const inProgressProjects = projects.filter((p) => p.status !== "finished");

  // Use the pagination hook for each section
  const {
    currentItems: currentCompletedProjects,
    PaginationControls: CompletedPaginationControls,
  } = usePagination(completedProjects, 5);

  const {
    currentItems: currentFailedProjects,
    PaginationControls: FailedPaginationControls,
  } = usePagination(failedProjects, 5);

  const {
    currentItems: currentProgressProjects,
    PaginationControls: ProgressPaginationControls,
  } = usePagination(inProgressProjects, 5);

  const renderProject = (project: any) => {
    const isValidated = project["validated?"] === true;
    const isFailed = project.status === "finished" && !isValidated;
    const isInProgress = project.status !== "finished";

    return (
      <View
        key={project.id}
        style={[
          styles.projectItem,
          isValidated ? styles.validatedProject : null,
          isFailed ? styles.failedProject : null,
        ]}
      >
        <Text style={styles.projectName}>{project.project.name}</Text>
        <View style={styles.projectDetails}>
          <Text
            style={[
              isFailed ? styles.failedText : null,
              isValidated ? styles.validatedText : null,
              isInProgress ? styles.projectStatus : null,
            ]}
          >
            {(project.status === "finished" &&
              ((isValidated && "Finished") || "Failed")) ||
              "In progress"}
            {project.final_mark !== null &&
              project.status === "finished" &&
              ` (${project.final_mark})`}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View>
      {inProgressProjects.length > 0 && (
        <View style={styles.projectSection}>
          <Text style={styles.projectSectionTitle}>In Progress</Text>
          {currentProgressProjects.map(renderProject)}
          <ProgressPaginationControls />
        </View>
      )}

      {completedProjects.length > 0 && (
        <View style={styles.projectSection}>
          <Text style={styles.projectSectionTitle}>Completed</Text>
          {currentCompletedProjects.map(renderProject)}
          <CompletedPaginationControls />
        </View>
      )}

      {failedProjects.length > 0 && (
        <View style={styles.projectSection}>
          <Text style={styles.projectSectionTitle}>Failed</Text>
          {currentFailedProjects.map(renderProject)}
          <FailedPaginationControls />
        </View>
      )}
    </View>
  );
};

export default function Profile() {
  const { login } = useLocalSearchParams<{ login: string }>();
  const [userData, setUserData] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!login) {
          throw new Error("No login provided");
        }

        const data = await userService.searchUser(login);
        setUserData(data);
      } catch (err) {
        console.error("Error fetching user:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load user data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [login]);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#121212"
        translucent={false}
      />
      <Stack.Screen
        options={{
          title: loading ? "Loading..." : userData?.login || "User Profile",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <FontAwesome name="arrow-left" size={24} color="gray" />
            </TouchableOpacity>
          ),
        }}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#42A5F5" />
          <Text style={styles.loadingText}>Loading user data...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <FontAwesome name="exclamation-circle" size={50} color="#F44336" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Back to Search</Text>
          </TouchableOpacity>
        </View>
      ) : userData ? (
        <ScrollView style={styles.scrollContainer}>
          <View style={styles.profileHeader}>
            <Image
              source={{ uri: userData.image?.link }}
              style={styles.profileImage}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.emailText}> {userData.login}</Text>

              <View style={styles.nameContainer}>
                <Text style={styles.loginText}>{userData.displayname}</Text>
              </View>
              <Text style={styles.emailText}>{userData.email}</Text>
            </View>
            <View style={styles.backArrow}>
              <TouchableOpacity onPress={() => router.back()}>
                <FontAwesome name="arrow-left" size={30} color="white" />
              </TouchableOpacity>
            </View>
          </View>
          <View>
            {userData.cursus_users && userData.cursus_users.length > 0 && (
              <LevelProgress
                level={getMainCursus(userData.cursus_users)?.level || 0}
              />
            )}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Wallet</Text>
                <Text style={styles.statValue}>{userData.wallet || 0}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Evaluation Points</Text>
                <Text style={styles.statValue}>
                  {userData.correction_point || 0}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.skillsContainer}>
            {/* Skills */}
            {userData.cursus_users &&
              userData.cursus_users.length > 0 &&
              userData.cursus_users[0].skills && (
                <SkillsList
                  skills={getMainCursus(userData.cursus_users)?.skills || []}
                />
              )}
          </View>
          {/* Projects */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Projects</Text>
            <View>
              {userData.projects_users &&
                userData.projects_users.length > 0 && (
                  <ProjectsList projects={userData.projects_users} />
                )}
            </View>
          </View>
        </ScrollView>
      ) : (
        <Text style={styles.noDataText}>No user data available</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    paddingTop: StatusBar.currentHeight || 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    marginTop: 10,
  },
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
  backArrow: {
    position: "absolute",
    right: 30,
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
  scrollContainer: {
    flex: 1,
  },
  profileHeader: {
    flexDirection: "row",
    padding: 20,
    backgroundColor: "#1E1E1E",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    alignItems: "center",
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#333",
  },
  profileInfo: {
    marginLeft: 20,
    justifyContent: "center",
  },
  loginText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  emailText: {
    color: "#bbb",
    marginTop: 5,
  },
  locationText: {
    color: "#bbb",
    marginTop: 5,
  },
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
  noDataText: {
    color: "#fff",
    textAlign: "center",
    margin: 20,
  },
  nameContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
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
  projectItem: {
    backgroundColor: "#2c2c2c",
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    borderLeftColor: "#64B5F6",
  },
  projectName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  projectDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  projectStatus: {
    color: "#bbb",
    fontSize: 14,
  },
  projectSectionTitle: {
    color: "#64B5F6",
    fontSize: 16,
    marginTop: 15,
    marginBottom: 5,
  },
  validatedProject: {
    borderLeftColor: "#00e676",
    borderLeftWidth: 4,
  },
  failedProject: {
    borderLeftColor: "red",
    borderLeftWidth: 4,
  },
  validatedText: {
    color: "#00e676",
  },
  failedText: {
    color: "darkred",
  },
  skillLevelLine: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 20,
  },
  paginationText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginHorizontal: 15,
  },
  paginationButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 3,
  },
  paginationButtonDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  projectSection: {
    marginBottom: 10,
  },
});
