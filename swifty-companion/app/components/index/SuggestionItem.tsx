import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableHighlight,
} from "react-native";
import { UserSuggestion } from "../../services/userService";
import colors from "@/constants/colors";

interface SuggestionItemProps {
  suggestion: UserSuggestion;
  searchQuery: string;
  onPress: () => void;
}

/**
 * Renders an individual suggestion item with highlighted matching text
 * Shows user avatar, login name with highlighted matching portion, and display name
 */
const SuggestionItem = ({
  suggestion,
  searchQuery,
  onPress,
}: SuggestionItemProps) => {
  // Function to highlight the matching part of the login
  const renderHighlightedText = (text: string, query: string) => {
    if (!query) return <Text style={styles.loginText}>{text}</Text>;

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);

    if (index === -1) return <Text style={styles.loginText}>{text}</Text>;

    return (
      <Text style={styles.loginText}>
        {text.substring(0, index)}
        <Text style={styles.highlight}>
          {text.substring(index, index + query.length)}
        </Text>
        {text.substring(index + query.length)}
      </Text>
    );
  };

  return (
    <TouchableHighlight
      onPress={onPress}
      underlayColor={colors.background.item}
      style={styles.container}
    >
      <View style={styles.innerContainer}>
        <Image
          source={{ uri: suggestion.image?.versions?.small }}
          style={styles.avatar}
          defaultSource={require('../../../assets/images/42_logo_white.png')} // Add default placeholder
        />
        <View style={styles.textContainer}>
          {renderHighlightedText(suggestion.login, searchQuery)}
          <Text style={styles.displayName}>{suggestion.displayname}</Text>
        </View>
      </View>
    </TouchableHighlight>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  innerContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.item,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background.item,
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  loginText: {
    color: colors.text.primary,
    fontSize: 16,
  },
  displayName: {
    color: colors.text.secondary,
    fontSize: 12,
    marginTop: 2,
  },
  highlight: {
    color: colors.accent.primary,
    fontWeight: "bold",
  },
});

export default SuggestionItem;
