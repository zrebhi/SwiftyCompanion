/**
 * SwiftyCompanion - Main Search Screen
 *
 * This is the landing page of the application where users can search for 42 students
 * by their login. It includes validation, error handling, and navigation to profile pages.
 *
 * @module SwiftyCompanion/Search
 */

import {
  Text,
  View,
  StyleSheet,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
// @ts-expect-error - Expo Router types issue
import { router } from "expo-router";
import { TouchableOpacity } from "react-native-gesture-handler";
import { Formik } from "formik";
import * as Yup from "yup";

import colors from "../constants/colors";
import userService from "./services/userService";

/**
 * Validation schema for the login search field
 * Ensures the login is provided and follows 42's login format requirements
 */
const LoginSchema = Yup.object().shape({
  login: Yup.string()
    .required("Please enter a login to search")
    .transform((value) => value.trim().toLowerCase())
    .matches(
      /^[a-z0-9_-]{2,20}$/i,
      "Login must be 2-20 characters and contain only letters, numbers, underscores, or hyphens"
    ),
});

/**
 * Main component for the search screen
 * Allows users to search for 42 students by login
 *
 * @returns {JSX.Element} The rendered component
 */
export default function Index() {
  /**
   * Handles the search operation when a login is submitted
   *
   * @param {string} login - The student login to search for
   * @param {Object} params - Formik helper functions
   * @param {Function} params.setSubmitting - Function to set form submission state
   */
  const handleSearch = async (
    login: string,
    { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }
  ) => {
    try {
      await userService.searchUser(login);
      router.push({
        pathname: "profile",
        params: { login },
      });
    } catch (error) {
      Alert.alert(
        "Search Error",
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Renders the app logo and title section
   */
  const LogoSection = () => (
    <View style={styles.logoContainer}>
      <Image
        source={require("../assets/images/42_logo_white.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Swifty Companions</Text>
    </View>
  );

  /**
   * Renders the search input field
   *
   * @param {Object} props - Component props
   * @param {string} props.value - Current value of the input field
   * @param {Function} props.onChange - Function to handle input change
   * @param {Function} props.onBlur - Function to handle input blur
   * @param {Function} props.onSubmit - Function to handle input submission
   */
  const SearchInput = ({
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

  /**
   * Renders an error message if validation fails
   *
   * @param {Object} props - Component props
   * @param {string | undefined} props.error - Error message to display
   */
  const ErrorMessage = ({ error }: { error: string | undefined }) => {
    if (!error) return null;
    return <Text style={styles.errorText}>{error}</Text>;
  };

  /**
   * Renders the search button
   *
   * @param {Object} props - Component props
   * @param {Function} props.onPress - Function to handle button press
   * @param {boolean} props.isDisabled - Whether the button is disabled
   * @param {boolean} props.isLoading - Whether the button shows a loading indicator
   */
  const SearchButton = ({
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

  /**
   * Renders the search form
   * Includes input field, error message, and search button
   */
  const SearchForm = () => (
    <Formik
      initialValues={{ login: "" }}
      validationSchema={LoginSchema}
      onSubmit={(values, formikHelpers) => {
        const normalizedLogin = values.login.trim().toLowerCase();
        handleSearch(normalizedLogin, formikHelpers);
      }}
    >
      {({
        handleChange,
        handleSubmit,
        handleBlur,
        values,
        errors,
        touched,
        isSubmitting,
      }) => (
        <View style={styles.searchContainer}>
          <SearchInput
            value={values.login}
            onChange={(text) => handleChange("login")(text)}
            onBlur={() => handleBlur("login")}
            onSubmit={() => handleSubmit()}
          />

          <ErrorMessage error={touched.login ? errors.login : undefined} />

          <SearchButton
            onPress={() => handleSubmit()}
            isDisabled={isSubmitting || !values.login.trim()}
            isLoading={isSubmitting}
          />
        </View>
      )}
    </Formik>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#121212"
        translucent={false}
      />
      <LogoSection />
      <SearchForm />
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
  errorText: {
    color: "#ff6b6b",
    fontSize: 14,
    marginTop: 5,
    marginBottom: 5,
    textAlign: "center",
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
  searchContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 50,
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
