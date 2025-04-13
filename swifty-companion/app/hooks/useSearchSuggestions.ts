import { useState, useEffect, useCallback, useRef } from "react";
import userService, { UserSuggestion } from "../services/userService";
import { debounce } from "../utils/debounce";

/**
 * Custom hook for handling search suggestions with debounced API calls.
 *
 * Features:
 * - Debounced API requests to prevent excessive calls during typing
 * - Loading state management
 * - Error handling
 * - Cancellation of pending requests when input changes
 *
 * @param {string} searchQuery - The current search query
 * @param {number} [delay=600] - The debounce delay in milliseconds
 * @param {number} [minChars=1] - Minimum characters required before triggering search
 * @returns {Object} Hook state and methods
 * @returns {UserSuggestion[]} .suggestions - Array of suggestion results
 * @returns {boolean} .isLoading - Whether suggestions are being fetched
 * @returns {string | null} .error - Error message if search failed
 */
const useSearchSuggestions = (
  searchQuery: string = "",
  delay = 600,
  minChars = 1
) => {
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track the latest query to avoid race conditions
  const latestQuery = useRef<string>("");

  // Clear suggestions and reset state
  const clear = useCallback(() => {
    setSuggestions([]);
    setLoading(false);
    setError(null);
    latestQuery.current = "";
  }, []);

  // Perform the actual search
  const fetchSuggestions = useCallback(
    async (query: string) => {
      if (!query || query.length < minChars) {
        setSuggestions([]);
        setLoading(false);
        return;
      }

      latestQuery.current = query;
      setLoading(true);
      setError(null);

      try {
        const results = await userService.getSearchSuggestions(query);

        // Only update if this query is still the latest one
        // (prevents out-of-order responses from overwriting newer results)
        if (query === latestQuery.current) {
          setSuggestions(results);
        }
      } catch (err) {
        console.error("Error fetching suggestions:", err);
        // Only update error if this query is still the latest one
        if (query === latestQuery.current) {
          setError("Failed to fetch suggestions");
          setSuggestions([]);
        }
      } finally {
        // Only update loading state if this query is still the latest one
        if (query === latestQuery.current) {
          setLoading(false);
        }
      }
    },
    [minChars]
  );

  // Debounced version of fetchSuggestions
  const debouncedFetch = useCallback(
    debounce((query: string) => {
      fetchSuggestions(query);
    }, delay),
    [fetchSuggestions, delay]
  );

  // Public search function to trigger the debounced search
  const search = useCallback(
    (query: string) => {
      latestQuery.current = query;

      if (!query || query.length < minChars) {
        setSuggestions([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      debouncedFetch(query);
    },
    [debouncedFetch, minChars]
  );

  // Call search whenever searchQuery changes
  useEffect(() => {
    search(searchQuery);
  }, [searchQuery, search]);

  return {
    suggestions,
    isLoading,
    error,
  };
};

export default useSearchSuggestions;
