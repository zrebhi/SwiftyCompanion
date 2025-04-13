const axios = require("axios");
const { tokenManager } = require("../utils/tokenManager");
const { retryRateLimitedRequest } = require("../utils/retryRateLimitedRequest");

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

  const { login } = req.query;

  if (!login) {
    return res.status(400).json({ error: "Login parameter is required" });
  }

  try {
    const token = await tokenManager.getValidToken();

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
