import React, { useState } from "react";
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
 * Coordinates between input and suggestions
 */
export const SearchForm = () => {
  // Track if form is currently being submitted to prevent duplicate submissions
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <Formik
      initialValues={{ login: "" }}
      validationSchema={LoginSchema}
      onSubmit={(values, formikHelpers) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        const normalizedLogin = values.login.trim().toLowerCase();
        handleSearch(normalizedLogin, {
          setSubmitting: (submitting) => {
            formikHelpers.setSubmitting(submitting);
            setIsSubmitting(submitting);
          },
        });
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
            onSubmit={() => {
              if (!isSubmitting) handleSubmit();
            }}
          />

          <ErrorMessage error={touched.login ? errors.login : undefined} />

          <SearchButton
            onPress={() => {
              if (!isSubmitting) handleSubmit();
            }}
            isDisabled={
              isSubmitting || formikIsSubmitting || !values.login.trim()
            }
            isLoading={isSubmitting || formikIsSubmitting}
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
