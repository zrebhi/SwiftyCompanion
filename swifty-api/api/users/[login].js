const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");
const { tokenManager } = require("../utils/tokenManager");
// Note: retryRateLimitedRequest might not be needed here anymore if we primarily hit the cache,
// but we'll keep it for the fallback/forceRefresh path for now.
const { retryRateLimitedRequest } = require("../utils/retryRateLimitedRequest");

// Initialize Supabase client - Use anon key for client-facing API
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Basic validation for Supabase env vars
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    "API Error: Missing Supabase environment variables (SUPABASE_URL, SUPABASE_ANON_KEY)."
  );
  // Avoid exiting process in serverless function, return error instead
}
// Initialize only if vars are present
const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

const API_BASE_URL = "https://api.intra.42.fr/v2";

/**
 * Serverless API endpoint handler for retrieving 42 user data.
 * Checks Supabase cache first, then falls back to 42 API.
 * Supports force refresh via query parameter.
 *
 * @async
 * @param {object} req - Vercel Request object
 * @param {object} req.query - Query parameters
 * @param {string} req.query.login - The 42 login to look up
 * @param {string} [req.query.forceRefresh] - If 'true', bypass cache and fetch fresh data.
 * @param {object} res - Vercel Response object
 * @returns {object} HTTP response with user data or error message
 */
module.exports = async (req, res) => {
  // Set CORS headers for browser access
  res.setHeader("Access-Control-Allow-Origin", "*"); // Adjust in production for security
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization"); // Allow Authorization if needed by client

  // Handle OPTIONS preflight request
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
    console.error(
      "API Error: Supabase client not initialized due to missing env vars."
    );
    return res.status(500).json({ error: "Server configuration error." });
  }

  const { login, forceRefresh } = req.query;
  const shouldForceRefresh = forceRefresh === "true";

  // Validate login parameter
  if (
    !login ||
    typeof login !== "string" ||
    !/^[a-zA-Z0-9_-]{2,20}$/.test(login)
  ) {
    return res
      .status(400)
      .json({ error: "Invalid or missing login parameter." });
  }

  try {
    // --- Step 1: Check Cache (unless forceRefresh is true) ---
    if (!shouldForceRefresh) {
      console.log(`Checking cache for user: ${login}`);
      const { data: cachedUser, error: selectError } = await supabase
        .from("users_cache")
        .select("*") // Select all columns for the cached data
        .eq("login", login)
        .maybeSingle();

      if (selectError) {
        console.error(
          `Supabase select error for ${login}:`,
          selectError.message
        );
        // Don't fail the request, just proceed to API fetch as fallback
      } else if (cachedUser) {
        console.log(`Cache hit for user: ${login}`);
        // Transform cached data to match the expected nested image structure
        const transformedCachedUser = {
          ...cachedUser, // Spread all existing cached fields
          image: {
            // Create the nested image object
            link: cachedUser.image_url, // Map image_url to image.link
          },
        };
        // Remove the now redundant flat image_url if desired (optional)
        // delete transformedCachedUser.image_url;

        // Optionally add cache headers (e.g., Cache-Control, ETag)
        return res.status(200).json(transformedCachedUser);
      } else {
        console.log(`Cache miss for user: ${login}`);
      }
    } else {
      console.log(`Force refresh requested for user: ${login}`);
    }

    // --- Step 2: Fetch from 42 API (if cache miss or forceRefresh) ---
    console.log(`Fetching from 42 API for user: ${login}`);
    const token = await tokenManager.getValidToken();
    const apiResponse = await retryRateLimitedRequest(() =>
      axios.get(`${API_BASE_URL}/users/${login}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    );
    const userData = apiResponse.data;

    // --- Step 3: Upsert into Cache (async, don't wait for it to return response) ---
    const dataToUpsert = {
      login: userData.login,
      displayname: userData.displayname,
      email: userData.email,
      image_url: userData.image?.link,
      wallet: userData.wallet,
      correction_points: userData.correction_point,
      cursus_users: userData.cursus_users,
      projects_users: userData.projects_users,
      last_refreshed_at: new Date().toISOString(),
    };

    // Perform upsert in background - don't await it to speed up response to client
    supabase
      .from("users_cache")
      .upsert(dataToUpsert, { onConflict: "login" })
      .then(({ error: upsertError }) => {
        if (upsertError) {
          console.error(
            `Supabase background upsert error for ${login}:`,
            upsertError.message
          );
        } else {
          console.log(`Successfully upserted ${login} in background.`);
        }
      });

    // --- Step 4: Return API Response ---
    // IMPORTANT: Return the *original* API data, not the potentially modified dataToUpsert
    return res.status(200).json(userData);
  } catch (error) {
    console.error(`Error processing request for ${login}:`, error);

    const status = error.response?.status || 500;
    const message = error.response?.data?.message || "Server error";

    return res.status(status).json({ error: message });
  }
};
