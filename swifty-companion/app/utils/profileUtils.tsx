/**
 * Profile-related utility functions
 */

/**
 * Gets the main cursus (educational program) from the user's cursus list
 * Returns the main cursus if found, otherwise returns the one with highest level
 * 
 * @param cursusUsers - Array of cursus_users from the 42 API
 * @returns The main cursus object or null if none exists
 */
export const getMainCursus = (cursusUsers: any[]) => {
    if (!cursusUsers?.length) return null;
    
    // Try to find a cursus with kind="main"
    const mainCursus = cursusUsers.find((cu) => cu.cursus?.kind === "main");
    
    // If no main cursus is found, return the one with the highest level
    return mainCursus || cursusUsers.sort((a, b) => b.level - a.level)[0];
  };
  
  // You can add other profile-related utility functions here in the future