const axios = require("axios");

/**
 * Token management for 42 API authentication
 */
class TokenManager {
  constructor() {
    this.tokenData = null;
    this.expiresAt = 0;
  }

  /**
   * Get a valid token, either from cache or by fetching a new one
   */
  async getValidToken() {
    if (this.tokenData && Date.now() < this.expiresAt) {
      return this.tokenData.access_token;
    }
    return this.fetchNewToken();
  }

  /**
   * Fetch a new token from 42 API
   */
  async fetchNewToken() {
    const clientId = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error(
        "CLIENT_ID or CLIENT_SECRET missing in environment variables"
      );
    }

    const data = new URLSearchParams();
    data.append("grant_type", "client_credentials");
    data.append("client_id", clientId); // API expects lowercase 'client_id'
    data.append("client_secret", clientSecret); // API expects lowercase 'client_secret'

    const response = await axios.post(
      "https://api.intra.42.fr/oauth/token",
      data.toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    this.tokenData = response.data;
    this.expiresAt = Date.now() + (response.data.expires_in - 60) * 1000;

    return response.data.access_token;
  }
}

// Create a singleton instance
const tokenManager = new TokenManager();

module.exports = {
  TokenManager,
  tokenManager, // Export the singleton instance
};
