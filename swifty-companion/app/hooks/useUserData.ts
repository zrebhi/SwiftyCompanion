import { useState, useEffect } from "react";
import userService, { UserDetail } from "../services/userService";

/**
 * Custom hook for fetching user data from the 42 API
 *
 * This hook handles the entire lifecycle of fetching user data:
 * - Loading state management
 * - Error handling
 * - Data fetching and storing
 *
 * @param {string | undefined} login - The 42 user login to fetch data for
 * @returns {Object} The hook state containing user data, loading state, and error information
 * @returns {UserDetail | null} .userData - The fetched user data or null if not yet loaded
 * @returns {boolean} .loading - Whether the data is currently being fetched
 * @returns {string | null} .error - Error message if fetch failed, or null if no error
 */
export const useUserData = (login: string | undefined) => {
  const [userData, setUserData] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!login) {
          throw new Error("No login provided");
        }

        const data = await userService.searchUser(login);
        setUserData(data);
      } catch (err) {
        console.error("Error fetching user:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load user data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [login]);

  return { userData, loading, error };
};

export default useUserData;
