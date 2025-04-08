/**
 * Profile Screen Component
 *
 * Displays detailed information about a 42 student profile including:
 * - Basic user info (image, name, email)
 * - Level progress
 * - Skills
 * - Projects
 */
import { View, Text, StyleSheet, StatusBar, ScrollView } from "react-native";
// @ts-expect-error - Expo Router types issue
import { useLocalSearchParams, useRouter, Stack } from "expo-router";

// Import our refactored components and hooks
import useUserData from "./hooks/useUserData";
import LevelProgress from "./components/profile/LevelProgress";
import SkillsList from "./components/profile/SkillsList";
import ProjectsList from "./components/profile/ProjectsList";
import ProfileHeader from "./components/profile/ProfileHeader";
import StatsSection from "./components/profile/StatsSection";
import ErrorDisplay from "./components/common/ErrorDisplay";
import LoadingDisplay from "./components/common/LoadingDisplay";
import { getMainCursus } from "./utils/profileUtils";

export default function Profile() {
  const { login } = useLocalSearchParams<{ login: string }>();
  const router = useRouter();

  const { userData, loading, error } = useUserData(login);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#121212"
        translucent={false}
      />

      {loading ? (
        <LoadingDisplay message="Loading user data..." />
      ) : error ? (
        <ErrorDisplay message={error} onBack={() => router.back()} />
      ) : userData ? (
        <ScrollView style={styles.scrollContainer}>
          <ProfileHeader
            userData={userData}
            onBackPress={() => router.back()}
          />

          <View>
            {userData.cursus_users && userData.cursus_users.length > 0 && (
              <LevelProgress
                level={getMainCursus(userData.cursus_users)?.level || 0}
              />
            )}
            <StatsSection
              wallet={userData.wallet}
              correctionPoints={userData.correction_point}
            />
          </View>

          {userData.cursus_users?.length > 0 &&
            userData.cursus_users[0].skills && (
              <SkillsList
                skills={getMainCursus(userData.cursus_users)?.skills || []}
              />
            )}

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Projects</Text>
            {userData.projects_users?.length > 0 && (
              <ProjectsList projects={userData.projects_users} />
            )}
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
  scrollContainer: {
    flex: 1,
  },
  noDataText: {
    color: "#fff",
    textAlign: "center",
    margin: 20,
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
});
