import React from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

/**
 * A styled input field for entering a 42 login to search.
 * Includes a search icon and handles input changes, blur events, and submission.
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
}) => (
  <View style={styles.searchBar}>
    <FontAwesome
      name="search"
      size={20}
      color="gray"
      style={styles.searchIcon}
    />
    <TextInput
      style={styles.searchInput}
      placeholder="Search for a 42 login..."
      value={value}
      onChangeText={onChange}
      onBlur={onBlur}
      placeholderTextColor="gray"
      onSubmitEditing={onSubmit}
    />
  </View>
);

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 50,
    width: "100%",
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
