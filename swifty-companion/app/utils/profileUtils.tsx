/**
 * Profile-related utility functions
 *
 * This module provides utility functions for working with user profile data.
 */

/**
 * Gets the main cursus (educational program) from the user's cursus list
 *
 * The main cursus is determined by:
 * 1. Finding a cursus with kind="main" if it exists
 * 2. If no main cursus exists, return the one with the highest level
 *
 * This is important because 42 students can be enrolled in multiple educational
 * tracks simultaneously, but we typically want to display their primary program.
 *
 * @param {any[]} cursusUsers - Array of cursus_users from the 42 API
 * @returns {any | null} The main cursus object or null if none exists
 */
export const getMainCursus = (cursusUsers: any[]) => {
  if (!cursusUsers?.length) return null;

  const mainCursus = cursusUsers.find((cu) => cu.cursus?.kind === "main");

  // If no main cursus is found, return the one with the highest level
  return mainCursus || cursusUsers.sort((a, b) => b.level - a.level)[0];
};

export default getMainCursus;
