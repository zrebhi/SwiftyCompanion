// swifty-api/api/users/search.js
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("API Search Error: Missing Supabase environment variables.");
}
const supabase = SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const MAX_SUGGESTIONS = 10;

/**
 * Serverless API endpoint handler for searching users in the cache.
 * Searches by login prefix or displayname containment (case-insensitive).
 *
 * @async
 * @param {object} req - Vercel Request object
 * @param {object} req.query - Query parameters
 * @param {string} req.query.q - The search query term.
 * @param {object} res - Vercel Response object
 * @returns {object} HTTP response with an array of user suggestions or error message
 */
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*"); // Adjust in production
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle OPTIONS preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only allow GET method
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET", "OPTIONS"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Check if Supabase client initialized correctly
  if (!supabase) {
     console.error("API Search Error: Supabase client not initialized.");
     return res.status(500).json({ error: "Server configuration error." });
  }

  const { q } = req.query;

  // Validate query parameter
  if (!q || typeof q !== 'string' || q.trim().length === 0) {
    return res.status(400).json({ error: "Missing or empty query parameter 'q'." });
  }

  const searchTerm = q.trim();
  // Prepare search patterns for ILIKE (case-insensitive)
  const loginPattern = `${searchTerm}%`; // Prefix search
  const displayNamePattern = `%${searchTerm}%`; // Contains search

  try {
    console.log(`Searching for users matching: '${searchTerm}'`);

    const { data, error } = await supabase
      .from('users_cache')
      .select('login, displayname, image_url')
      // Use ILIKE for case-insensitive search on both fields
      .or(`login.ilike.${loginPattern},displayname.ilike.${displayNamePattern}`)
      .limit(MAX_SUGGESTIONS);

    if (error) {
      console.error(`Supabase search error for query '${searchTerm}':`, error.message);
      return res.status(500).json({ error: "Database query failed." });
    }

    // Transform data to match expected frontend structure (UserSuggestion-like)
    const suggestions = (data || []).map(user => ({
      login: user.login,
      displayname: user.displayname,
      // Create the nested image structure expected by the frontend
      image: {
          versions: {
              small: user.image_url
          }
      }
    }));

    console.log(`Found ${suggestions.length} suggestions for '${searchTerm}'`);
    return res.status(200).json(suggestions); // Return transformed data

  } catch (error) {
    console.error(`Unexpected error during search for '${searchTerm}':`, error);
    return res.status(500).json({ error: "Internal server error." });
  }
};
