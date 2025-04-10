import React from "react";
import { Text, StyleSheet, ActivityIndicator } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";

/**
 * A button component for initiating a search action.
 * Displays a loading spinner when `isLoading` is true and disables the button when `isDisabled` is true.
 *
 * @param {object} props - Component props.
 * @param {() => void} props.onPress - Callback function triggered when the button is pressed.
 * @param {boolean} props.isDisabled - Whether the button is disabled.
 * @param {boolean} props.isLoading - Whether the button is in a loading state.
 * @returns {JSX.Element} The rendered search button component.
 */
export const SearchButton = ({
  onPress,
  isDisabled,
  isLoading,
}: {
  onPress: () => void;
  isDisabled: boolean;
  isLoading: boolean;
}) => (
  <TouchableOpacity
    style={[styles.searchButton, isDisabled && styles.searchButtonDisabled]}
    onPress={onPress}
    disabled={isDisabled}
  >
    {isLoading ? (
      <ActivityIndicator color="white" />
    ) : (
      <Text style={styles.searchButtonText}>Search</Text>
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  searchButton: {
    borderColor: "white",
    borderWidth: 1,
    borderRadius: 25,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    width: "100%",
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  searchButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default SearchButton;
