import * as SecureStore from "expo-secure-store";
import axios from "axios";
import Constants from "expo-constants";

/*
Token Management:

We store the token both in memory (for quick access) and SecureStore (for persistence)
We track when the token expires to know when to refresh it

Efficient Token Retrieval Process:

First check memory for a valid token (fastest)
Then check secure storage (if not in memory)
Only if both fail, request a new token from the API

Security:

Using expo-secure-store to safely store tokens
Accessing environment variables through Expo Constants
Adding a 60-second buffer before expiration as a safety margin
*/

// Token response structure from the API
interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

// Structure for storing token with expiration
interface StoredToken {
  tokenData: TokenResponse;
  expiresAt: number;
}

class AuthService {
  private tokenData: TokenResponse | null = null; // In-memory token storage
  private expiresAt: number = 0; // Token expiration timestamp

  // Retrieve a valid token, refreshing if necessary
  async getValidToken(): Promise<string> {
    // Check in-memory token
    if (this.tokenData && Date.now() < this.expiresAt) {
      console.log("Using existing token from memory");
      return this.tokenData.access_token;
    }

    // Check secure storage
    const storedToken = await this.getStoredToken();
    if (storedToken && Date.now() < storedToken.expiresAt) {
      console.log("Using token from secure storage");
      this.tokenData = storedToken.tokenData;
      this.expiresAt = storedToken.expiresAt;
      return this.tokenData.access_token;
    }

    // Fetch a new token if none is valid
    console.log("Fetching new token from API");
    return this.fetchNewToken();
  }

  // Retrieve token from secure storage
  private async getStoredToken(): Promise<StoredToken | null> {
    try {
      const tokenString = await SecureStore.getItemAsync("42_api_token");
      if (!tokenString) return null;
      return JSON.parse(tokenString) as StoredToken;
    } catch (error) {
      console.error("Error retrieving token from storage:", error);
      return null;
    }
  }

  // Save token to memory and secure storage
  private async saveToken(tokenData: TokenResponse): Promise<void> {
    const expiresAt = Date.now() + (tokenData.expires_in - 60) * 1000; // Subtract 60s for safety margin
    this.tokenData = tokenData;
    this.expiresAt = expiresAt;

    try {
      const tokenToStore: StoredToken = { tokenData, expiresAt };
      await SecureStore.setItemAsync(
        "42_api_token",
        JSON.stringify(tokenToStore)
      );
    } catch (error) {
      console.error("Error saving token to storage:", error);
    }
  }

  // Fetch a new token from the API
  private async fetchNewToken(): Promise<string> {
    try {
      // Using environment variables from .env through Expo Constants
      const clientId = Constants.expoConfig?.extra?.CLIENT_ID;
      const clientSecret = Constants.expoConfig?.extra?.CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        throw new Error(
          "CLIENT_ID or CLIENT_SECRET missing in environment variables"
        );
      }

      const data = new URLSearchParams();
      data.append("grant_type", "client_credentials");
      data.append("client_id", clientId);
      data.append("client_secret", clientSecret);

      const response = await axios.post<TokenResponse>(
        "https://api.intra.42.fr/oauth/token",
        data.toString(),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      await this.saveToken(response.data); // Save the new token
      return response.data.access_token;
    } catch (error) {
      console.error("Error fetching token from API:", error);
      throw new Error(
        "Authentication failed. Verify credentials and network connection."
      );
    }
  }
}

export default new AuthService();
