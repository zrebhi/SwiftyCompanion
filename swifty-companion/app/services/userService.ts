import axios from "axios";
import authService from "./authService";

// Interfaces for user data
export interface UserBasic {
  id: number;
  login: string;
  url: string;
  email: string;
  image: { link: string };
}

export interface ProjectUser {
  project: {
    name: string;
  };
  status: string;
  final_mark: number | null;
  "validated?": boolean | null;
}

export interface Skill {
  id: number;
  name: string;
  level: number;
}

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

class UserService {
  // Search for a user by login
  async searchUser(login: string): Promise<UserDetail> {
    try {
      const token = await authService.getValidToken();
      const response = await axios.get(
        `https://api.intra.42.fr/v2/users/${login}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
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
