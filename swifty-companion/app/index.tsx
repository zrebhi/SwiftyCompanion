import { Text, View, StyleSheet, TextInput, Image } from "react-native";
import { useState } from "react";
import { FontAwesome } from "@expo/vector-icons";

import colors from "../constants/colors";

export default function Index() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require("../assets/images/42_logo_white.png")}
          style={styles.logo}
          resizeMode="contain" />
        <Text style={styles.title}>Swifty Companion</Text> 
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <FontAwesome name="search" size={20} color="gray" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a 42 login..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="gray"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.darker,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  logo: {
    width: 150,
    height: 150,
    alignItems: "flex-start",
  },
  logoContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    width: "100%",
    // borderColor: "red",
    // borderWidth: 5,
  },
  searchContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 50,
    width: "100%",
    // borderColor: "white",
    // borderWidth: 5,
  },
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
  title: {
    fontSize: 35,
    color: "white",
    fontWeight: "bold",
  },
});