const axios = require("axios");
const { retryRateLimitedRequest } = require("../utils/retryRateLimitedRequest");

let tokenData = null;
let expiresAt = 0;

/**
 * Gets a valid OAuth token for authenticating with the 42 API
 * Uses caching to avoid unnecessary token requests
 *
 * @async
 * @returns {Promise<string>} A valid OAuth access token
 * @throws {Error} If token retrieval fails
 */
async function getValidToken() {
  // Check if token exists and is still valid
  if (tokenData && Date.now() < expiresAt) {
    return tokenData.access_token;
  }

  // Fetch new token
  return fetchNewToken();
}

/**
 * Fetches a new OAuth token from the 42 API
 *
 * @async
 * @returns {Promise<string>} A fresh OAuth access token
 * @throws {Error} If environment variables are missing or API request fails
 */
async function fetchNewToken() {
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "CLIENT_ID or CLIENT_SECRET missing in environment variables"
    );
  }

  const data = new URLSearchParams();
  data.append("grant_type", "client_credentials");
  data.append("client_id", clientId);
  data.append("client_secret", clientSecret);

  const response = await axios.post(
    "https://api.intra.42.fr/oauth/token",
    data.toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  // Save token data and set expiry
  tokenData = response.data;
  expiresAt = Date.now() + (response.data.expires_in - 60) * 1000;

  return response.data.access_token;
}

/**
 * Serverless API endpoint handler for retrieving 42 user data
 * Validates input, fetches data from the 42 API, and returns the response
 *
 * @async
 * @param {object} req - HTTP request object
 * @param {object} req.query - Query parameters
 * @param {string} req.query.login - The 42 login to look up
 * @param {object} res - HTTP response object
 * @returns {object} HTTP response with user data or error message
 */
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle OPTIONS preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Reject methods other than GET and OPTIONS
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { login } = req.query;

  // Validate login parameter
  if (!login) {
    return res.status(400).json({ error: "Login parameter is required" });
  }

  // Check for excessive length (reasonable limit for usernames)
  if (login.length > 100) {
    return res.status(400).json({ error: "Login parameter too long" });
  }

  // Basic input sanitization - only allow alphanumeric chars, hyphen and underscore
  if (!/^[a-zA-Z0-9_-]+$/.test(login)) {
    return res.status(400).json({ error: "Login contains invalid characters" });
  }

  try {
    const token = await getValidToken();

    // Use the retry function for the API call
    const response = await retryRateLimitedRequest(() =>
      axios.get(`https://api.intra.42.fr/v2/users/${login}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    );

    return res.status(200).json(response.data);
  } catch (error) {
    console.error("Error fetching user data:", error);

    const status = error.response?.status || 500;
    const message = error.response?.data?.message || "Server error";

    return res.status(status).json({ error: message });
  }
};
