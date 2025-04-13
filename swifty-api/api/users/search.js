const axios = require("axios");
const { tokenManager } = require("../utils/tokenManager");
const { retryRateLimitedRequest } = require("../utils/retryRateLimitedRequest");

/**
 * Serverless function handler for user search
 * Handles CORS, authentication with the 42 API, and error responses
 *
 * @param {object} req - HTTP request object
 * @param {object} res - HTTP response object
 * @returns {Promise<void>}
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

  try {
    // Get a valid token for API requests
    const token = await tokenManager.getValidToken();

    const suggestions = await handleUserSearch(req, token);
    return res.status(200).json(suggestions);
  } catch (error) {
    console.error("Error handling search request:", error);

    const status = error.status || error.response?.status || 500;
    const message =
      error.message || error.response?.data?.message || "Internal server error";

    return res.status(status).json({ error: message });
  }
};

/**
 * Handle user search requests against the 42 API
 * Searches for users based on the login name query parameter
 *
 * @param {object} req - HTTP request object
 * @param {string} token - Valid OAuth token for the 42 API
 * @returns {Promise<Array>} Array of user suggestion objects
 * @throws {object} Error with status code and message if search fails
 */
async function handleUserSearch(req, token) {
  const { q, limit = 5 } = req.query;

  if (!q) {
    throw { status: 400, message: "Search query (q) is required" };
  }

  // Build query parameters for the 42 API
  const params = new URLSearchParams();

  params.append("query", q);

  const lastIndex = q.length - 1;
  q.charCodeAt(lastIndex);

  // Increment the last character (works for 'z' -> '{', 'y' -> 'z', etc.)
  const endChar = String.fromCharCode(q.charCodeAt(lastIndex) + 1);
  let endQuery;
  // Replace the last character with the incremented value
  if (q.charAt(lastIndex) === "z") {
    endQuery = q + "z";
    console.log("endQuery:", endQuery);
  } else {
    endQuery = q.slice(0, lastIndex) + endChar;
  }

  console.log("lastLetter:", String.fromCharCode(q.charCodeAt(lastIndex)));
  console.log(`range: ${q},${endQuery}`); // For q="az", outputs "az,a{"
  params.append("range[login]", `${q},${endQuery}`);

  params.append("sort", "login");
  params.append("page[size]", limit);

  const apiUrl = `https://api.intra.42.fr/v2/users?${params.toString()}`;
  console.log("API URL:", apiUrl);

  try {
    const response = await retryRateLimitedRequest(() =>
      axios.get(apiUrl, {
        headers: { Authorization: `Bearer ${token}` },
      })
    );

    const results = response.data || [];

    // Extract only the needed fields to reduce payload size
    const suggestions = results.map((user) => ({
      id: user.id,
      login: user.login,
      displayname: user.displayname || user.login,
      image: user.image,
    }));
    console.log("Search results:", results);

    return suggestions;
  } catch (error) {
    console.error("Error searching 42 API:", error.message);
    if (error.response) {
      console.error("API error status:", error.response.status);
      console.error(
        "API error data:",
        JSON.stringify(error.response.data, null, 2)
      );
    }
    throw error;
  }
}
