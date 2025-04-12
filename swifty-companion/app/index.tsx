/**
 * SwiftyCompanion - Main Search Screen
 *
 * This is the landing page of the application where users can search for 42 students
 * by their login. It includes validation, error handling, and navigation to profile pages.
 *
 * @module SwiftyCompanion/Search
 */

import React from "react";
import { View, StyleSheet, StatusBar, SafeAreaView } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import colors from "../constants/colors";
import LogoSection from "./components/index/LogoSection";
import SearchForm from "./components/index/SearchForm";
import { ScrollView } from "react-native-gesture-handler";

/**
 * Main component for the search screen
 * Allows users to search for 42 students by login
 *
 * @returns {JSX.Element} The rendered component
 */
export default function Index() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView>
        <View style={styles.container}>
          <StatusBar
            barStyle="light-content"
            backgroundColor="#121212"
            translucent={false}
          />
          <LogoSection />
          <SearchForm />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.darker,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background.darker,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
});
