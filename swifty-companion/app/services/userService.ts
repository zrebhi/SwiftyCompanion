import axios from "axios";
import Constants from "expo-constants";
import ENV from "../utils/EnvValidation";

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
  async searchUser(login: string): Promise<UserDetail> {
    try {
      const URL = `${ENV.API_BASE_URL}/api/users/${login}`;
      console.log("Sending request to:", URL);
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
