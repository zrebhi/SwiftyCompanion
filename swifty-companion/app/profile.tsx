/**
 * Profile Screen Component
 *
 * Displays detailed information about a 42 student profile including:
 * - Basic user info (image, name, email)
 * - Level progress
 * - Skills
 * - Projects
 *
 * This component serves as the main container for the profile page, handling data fetching
 * via the useUserData hook and coordinating the display of all profile sections.
 *
 * @module Profile
 * @return {JSX.Element} The rendered profile screen component
 */
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  SafeAreaView,
} from "react-native";
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
import colors from "@/constants/colors";

export default function Profile() {
  const { login } = useLocalSearchParams<{ login: string }>();
  const router = useRouter();

  const { userData, loading, error } = useUserData(login);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.background.darker}
        translucent={false}
      />

      {loading ? (
        <LoadingDisplay message="Loading user data..." />
      ) : error ? (
        <ErrorDisplay message={error} onBack={() => router.back()} />
      ) : userData ? (
        <ScrollView style={styles.scrollContainer}>
        <View style={styles.sectionContainer}>
          <ProfileHeader
            userData={userData}
            onBackPress={() => router.back()}
          />
        </View>

          <View style={styles.sectionContainer}>
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
          <View style={styles.sectionContainer}>
            {userData.cursus_users?.length > 0 &&
              userData.cursus_users[0].skills && (
                <SkillsList
                  skills={getMainCursus(userData.cursus_users)?.skills || []}
                />
              )}
          </View>

          <View style={styles.sectionContainer}>
            {userData.projects_users?.length > 0 && (
              <ProjectsList projects={userData.projects_users} />
            )}
          </View>
        </ScrollView>
      ) : (
        <Text style={styles.noDataText}>No user data available</Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.darker,
  },
  scrollContainer: {
    flex: 1,
  },
  noDataText: {
    color: colors.text.primary,
    textAlign: "center",
    margin: 20,
  },
  sectionContainer: {
    backgroundColor: colors.background.lighter,
    padding: 0,
    marginVertical: 10,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: "bold",
  },
});
