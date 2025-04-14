import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { UserSuggestion } from "../../services/userService";
import SuggestionItem from "./SuggestionItem";
import colors from "@/constants/colors";

interface SearchSuggestionsProps {
  suggestions: UserSuggestion[];
  isLoading: boolean;
  isVisible: boolean;
  onSelectSuggestion: (login: string) => void;
  searchQuery: string;
}

/**
 * Displays a dropdown of search suggestions below the search input
 * Handles loading state, empty results, and rendering the list of suggestions
 */
const SearchSuggestions = ({
  suggestions,
  isLoading,
  isVisible,
  onSelectSuggestion,
  searchQuery,
}: SearchSuggestionsProps) => {
  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.accent.primary} />
          <Text style={styles.messageText}>Searching...</Text>
        </View>
      ) : suggestions.length === 0 && searchQuery.length > 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.messageText}>No result found</Text>
        </View>
      ) : (
        <FlatList
          data={suggestions}
          // Use login as the key, as it's unique and provided by the search API
          keyExtractor={(item) => item.login}
          renderItem={({ item }) => (
            <SuggestionItem
              suggestion={item}
              searchQuery={searchQuery}
              onPress={() => onSelectSuggestion(item.login)}
            />
          )}
          style={styles.list}
          contentContainerStyle={
            suggestions.length === 0 ? styles.emptyList : null
          }
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: colors.background.lighter,
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 250,
    zIndex: 1000,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.background.item,
  },
  list: {
    width: "100%",
  },
  loadingContainer: {
    padding: 15,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  emptyContainer: {
    padding: 15,
    alignItems: "center",
  },
  emptyList: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  messageText: {
    color: colors.text.secondary,
    marginLeft: 10,
  },
});

export default SearchSuggestions;
