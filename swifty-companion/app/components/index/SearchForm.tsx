import React from "react"; // Removed useState
import { View, StyleSheet, Alert } from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
// @ts-expect-error - Expo Router types issue
import { router } from "expo-router";

import SearchInput from "./SearchInput";
import ErrorMessage from "./ErrorMessage";
import SearchButton from "./SearchButton";
import userService from "../../services/userService";

/**
 * Validation schema for the login search field.
 * Ensures the login is required, trimmed, and matches the allowed format.
 */
const LoginSchema = Yup.object().shape({
  login: Yup.string()
    .transform((value) => value.trim().toLowerCase())
    .matches(
      /^[a-z0-9_-]{1,20}$/i,
      "Login must be 1-20 characters and contain only letters, numbers, underscores, or hyphens"
    ),
});

/**
 * Handles the search operation when a login is submitted.
 * Navigates to the profile page if the search is successful.
 *
 * @param {string} login - The login to search for.
 * @param {object} helpers - Formik helpers for managing form state.
 * @param {function} setSubmitting - Formik's function to toggle the submitting state (though we won't need async/await here anymore).
 */
const handleSearch = ( // Removed async
  login: string,
  setSubmitting: (isSubmitting: boolean) => void
) => {
  router.push({
    pathname: "profile",
    params: { login },
  });
  // It's good practice to set submitting to false immediately after navigation is initiated.
  setSubmitting(false);
};

/**
 * Renders the search form
 * Includes input field, error message, and search button
 * Coordinates between input and suggestions
 */
export const SearchForm = () => {
  // Removed local isSubmitting state

  return (
    <Formik
      initialValues={{ login: "" }}
      validationSchema={LoginSchema}
      // Use Formik's isSubmitting internally to prevent double submission
      onSubmit={(values, { setSubmitting }) => { // Removed async
        // Formik handles preventing double submits while isSubmitting is true
        const normalizedLogin = values.login.trim().toLowerCase();
        // Pass Formik's setSubmitting directly to handleSearch
        handleSearch(normalizedLogin, setSubmitting); // Removed await
      }}
    >
      {({
        handleChange,
        handleSubmit,
        handleBlur,
        values,
        errors,
        touched,
        isSubmitting: formikIsSubmitting,
      }) => (
        <View style={styles.searchContainer}>
          <SearchInput
            value={values.login}
            onChange={(text) => handleChange("login")(text)}
            onBlur={() => handleBlur("login")}
            // Directly use Formik's handleSubmit for submission trigger
            onSubmit={handleSubmit}
          />

          <ErrorMessage error={touched.login ? errors.login : undefined} />

          <SearchButton
            // Directly use Formik's handleSubmit for submission trigger
            onPress={() => handleSubmit()}
            // Rely solely on Formik's isSubmitting state
            isDisabled={formikIsSubmitting || !values.login.trim()}
            isLoading={formikIsSubmitting}
          />
        </View>
      )}
    </Formik>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 50,
    width: "100%",
  },
});

export default SearchForm;
