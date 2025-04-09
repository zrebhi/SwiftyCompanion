const axios = require('axios');

let tokenData = null;
let expiresAt = 0;

// Get a valid token
async function getValidToken() {
  // Check if token exists and is still valid
  if (tokenData && Date.now() < expiresAt) {
    return tokenData.access_token;
  }

  // Fetch new token
  return fetchNewToken();
}

// Fetch a new token from 42 API
async function fetchNewToken() {
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error("CLIENT_ID or CLIENT_SECRET missing in environment variables");
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

// Serverless function handler
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { login } = req.query;
  
  if (!login) {
    return res.status(400).json({ error: 'Login parameter is required' });
  }
  
  try {
    const token = await getValidToken();
    
    const response = await axios.get(`https://api.intra.42.fr/v2/users/${login}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Error fetching user data:', error);
    
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || 'Server error';
    
    return res.status(status).json({ error: message });
  }
};