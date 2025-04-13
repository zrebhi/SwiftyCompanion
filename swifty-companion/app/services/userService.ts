import axios from "axios";
import ENV from "../utils/EnvValidation";

/**
 * Represents basic user data from the 42 API
 *
 * @interface UserBasic
 * @property {number} id - User's unique identifier
 * @property {string} login - User's login name (username)
 * @property {string} url - API URL for the user resource
 * @property {string} email - User's email address
 * @property {object} image - User's profile image information
 * @property {string} image.link - URL to the user's profile image
 */
export interface UserBasic {
  id: number;
  login: string;
  url: string;
  email: string;
  image: { link: string };
}

/**
 * Represents a user's project data
 *
 * @interface ProjectUser
 * @property {object} project - The project information
 * @property {string} project.name - Name of the project
 * @property {string} status - Status of the project for this user (e.g. "finished", "in_progress")
 * @property {number | null} final_mark - The user's final grade for the project, null if not yet graded
 * @property {boolean | null} "validated?" - Whether the project was validated/passed
 */
export interface ProjectUser {
  project: {
    name: string;
  };
  status: string;
  final_mark: number | null;
  "validated?": boolean | null;
}

/**
 * Represents a skill in the 42 curriculum
 *
 * @interface Skill
 * @property {number} id - Unique identifier for the skill
 * @property {string} name - Name of the skill (e.g. "Unix", "Algorithms & AI")
 * @property {number} level - User's proficiency level in this skill
 */
export interface Skill {
  id: number;
  name: string;
  level: number;
}

/**
 * Represents detailed user information, extending the basic user data
 *
 * @interface UserDetail
 * @extends UserBasic
 * @property {string} phone - User's phone number
 * @property {string} displayname - User's display name
 * @property {number} correction_point - User's correction points (evaluation currency)
 * @property {number} wallet - User's wallet balance
 * @property {ProjectUser[]} projects_users - Array of projects associated with the user
 * @property {Array<{grade: string | null; level: number; skills: Skill[]}>} cursus_users - User's data for each educational program
 */
export interface UserDetail extends UserBasic {
  phone: string;
  displayname: string;
  correction_point: number;
  wallet: number;
  projects_users: ProjectUser[];
  cursus_users: Array<{
    grade: string | null;
    level: number;
    skills: Skill[];
  }>;
}

/**
 * Represents a user suggestion result from the 42 API
 *
 * @interface UserSuggestion
 * @property {number} id - User's unique identifier
 * @property {string} login - User's login name (username)
 * @property {string} displayname - User's display name
 * @property {object} image - User's profile image information
 * @property {string} image.versions.small - URL to the user's small profile image
 */
export interface UserSuggestion {
  id: number;
  login: string;
  displayname: string;
  image: {
    versions: {
      small: string;
    };
  };
}

/**
 * Service for interacting with user-related API endpoints
 * Provides methods to search and retrieve user data from the 42 API
 */
class UserService {
  // Cache for storing suggestion results
  private suggestionCache: {
    [query: string]: { data: UserSuggestion[]; timestamp: number };
  } = {};
  private readonly CACHE_TTL = 120000; // 2 minutes in milliseconds
  private readonly MAX_CACHE_SIZE = 50; // To limit memory usage

  /**
   * Searches for a user by login name
   *
   * This method calls the API to fetch detailed information about a specific user.
   * It handles errors by throwing meaningful error messages that can be displayed to the user.
   *
   * @param {string} login - The login name to search for
   * @returns {Promise<UserDetail>} Promise resolving to the user's detailed information
   * @throws {Error} When the user is not found or other API errors occur
   */
  async searchUser(login: string): Promise<UserDetail> {
    try {
      const URL = `${ENV.API_BASE_URL}/api/users/${login}`;
      const response = await axios.get(URL);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw new Error("User not found");
      }
      console.error("Error searching user:", error);
      throw new Error("Failed to search user. Please try again.");
    }
  }

  /**
   * Gets search suggestions as the user types a login name
   *
   * This method is optimized for quick, partial search requests and respects API rate limits.
   * It uses caching to reduce API calls and only searches for queries with at least 2 characters.
   *
   * @param {string} query - The partial login name to search for
   * @param {number} [limit=5] - The maximum number of suggestions to return
   * @returns {Promise<UserSuggestion[]>} Promise resolving to an array of user suggestions
   */
  async getSearchSuggestions(
    query: string,
    limit: number = 5
  ): Promise<UserSuggestion[]> {
    // Only search if we have at least 1 character to avoid excessive API calls
    if (!query || query.length < 1) {
      return [];
    }

    const normalizedQuery = query.trim().toLowerCase();

    // Check cache first
    if (
      this.suggestionCache[normalizedQuery] &&
      Date.now() - this.suggestionCache[normalizedQuery].timestamp <
        this.CACHE_TTL
    ) {
      return this.suggestionCache[normalizedQuery].data;
    }

    try {
      // const URL = `${ENV.API_BASE_URL}/api/users/search?q=${encodeURIComponent(
      //   normalizedQuery
      // )}&sort=login&limit=${limit}`;
      const URL = `${ENV.API_BASE_URL}/api/users/search?q=${encodeURIComponent(
        normalizedQuery
      )}`;

      console.log("Fetching suggestions from API:", URL);
      const response = await axios.get(URL);
      const suggestions = response.data || [];

      // Cache the results
      this.suggestionCache[normalizedQuery] = {
        data: suggestions,
        timestamp: Date.now(),
      };
      // If the cache is full, clear outdated entries
      if (Object.keys(this.suggestionCache).length >= this.MAX_CACHE_SIZE)
        this.clearOutdatedCache();

      return suggestions;
    } catch (error) {
      console.error("Error getting search suggestions:", error);
      return []; // Return empty array on error to avoid breaking the UI
    }
  }

  clearOutdatedCache() {
    for (const key in this.suggestionCache) {
      if (Date.now() - this.suggestionCache[key].timestamp > this.CACHE_TTL) {
        delete this.suggestionCache[key];
      }
    }
    // If the cache is still too large, remove the oldest entries
    while (Object.keys(this.suggestionCache).length >= this.MAX_CACHE_SIZE) {
      const keyToRemove = Object.keys(this.suggestionCache)[0]; // This is necessary because Object.keys() returns a temporary array, not a reference
      delete this.suggestionCache[keyToRemove];
    }
  }
}

export default new UserService();
