import React, { useState, useRef } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import useSearchSuggestions from "../../hooks/useSearchSuggestions";
import SearchSuggestions from "./SearchSuggestions";
import colors from "@/constants/colors";

/**
 * A styled input field for entering a 42 login to search.
 * Includes a search icon and handles input changes, blur events, and submission.
 * Displays search suggestions as the user types.
 *
 * @param {object} props - Component props.
 * @param {string} props.value - The current value of the input field.
 * @param {(text: string) => void} props.onChange - Callback for handling text changes.
 * @param {() => void} props.onBlur - Callback for handling blur events.
 * @param {() => void} props.onSubmit - Callback for handling submission events.
 * @returns {JSX.Element} The rendered search input component.
 */
export const SearchInput = ({
  value,
  onChange,
  onBlur,
  onSubmit,
}: {
  value: string;
  onChange: (text: string) => void;
  onBlur: () => void;
  onSubmit: () => void;
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const { suggestions, isLoading, error } = useSearchSuggestions(value);

  const handleSelectSuggestion = (login: string) => {
    onChange(login);
    // After selecting a suggestion, hide the suggestions and submit the form
    Keyboard.dismiss();
    onSubmit();
  };

  const handleInputFocus = () => {
    setIsFocused(true);
  };

  const handleInputBlur = () => {
    // Small delay to allow touch events on suggestions to complete
    setTimeout(() => {
      setIsFocused(false);
      onBlur();
    }, 150);
  };

  // We want to show suggestions when:
  // 1. Input is focused AND
  // 2. Either there are suggestions OR we're loading suggestions
  // const showSuggestions = isFocused && (suggestions.length > 0 || isLoading);
  const showSuggestions =
    isFocused && (suggestions.length > 0 && value.length > 0 || isLoading);

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback
        onPress={() => {
          inputRef.current?.focus();
        }}
      >
        <View style={[styles.searchBar, isFocused && styles.searchBarFocused]}>
          <FontAwesome
            name="search"
            size={20}
            color="gray"
            style={styles.searchIcon}
          />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search for a 42 login..."
            value={value}
            onChangeText={onChange}
            onBlur={handleInputBlur}
            onFocus={handleInputFocus}
            placeholderTextColor="gray"
            onSubmitEditing={onSubmit}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </TouchableWithoutFeedback>

      <SearchSuggestions
        suggestions={suggestions}
        isLoading={isLoading}
        isVisible={showSuggestions}
        onSelectSuggestion={handleSelectSuggestion}
        searchQuery={value}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    width: "100%",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 50,
    width: "100%",
    borderWidth: 1,
    borderColor: "transparent",
  },
  searchBarFocused: {
    borderColor: colors.accent.primary,
    shadowColor: colors.accent.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "black",
    height: "100%",
  },
});

export default SearchInput;
