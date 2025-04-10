import React from "react";
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
    .required("Please enter a login to search")
    .transform((value) => value.trim().toLowerCase())
    .matches(
      /^[a-z0-9_-]{2,20}$/i,
      "Login must be 2-20 characters and contain only letters, numbers, underscores, or hyphens"
    ),
});

/**
 * Handles the search operation when a login is submitted.
 * Navigates to the profile page if the search is successful.
 *
 * @param {string} login - The login to search for.
 * @param {object} helpers - Formik helpers for managing form state.
 * @param {function} helpers.setSubmitting - Function to toggle the submitting state.
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
 * Renders the search form
 * Includes input field, error message, and search button
 */
export const SearchForm = () => (
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

const styles = StyleSheet.create({
  searchContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 50,
    width: "100%",
  },
});

export default SearchForm;
