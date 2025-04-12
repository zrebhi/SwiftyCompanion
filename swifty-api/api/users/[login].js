const axios = require("axios");
const { tokenManager } = require("../utils/tokenManager");

// Serverless function handler
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

    const response = await axios.get(
      `https://api.intra.42.fr/v2/users/${login}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return res.status(200).json(response.data);
  } catch (error) {
    console.error("Error fetching user data:", error);

    const status = error.response?.status || 500;
    const message = error.response?.data?.message || "Server error";

    return res.status(status).json({ error: message });
  }
};
