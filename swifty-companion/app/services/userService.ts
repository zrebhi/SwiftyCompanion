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
 * Service for interacting with user-related API endpoints
 * Provides methods to search and retrieve user data from the 42 API
 */
class UserService {
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
}

export default new UserService();
