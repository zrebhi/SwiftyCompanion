const axios = require("axios");
const { createClient } = require('@supabase/supabase-js');
const { tokenManager } = require("../utils/tokenManager");
const { retryRateLimitedRequest } = require("../utils/retryRateLimitedRequest");

// --- Initialization ---
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const API_BASE_URL = "https://api.intra.42.fr/v2";

// Initialize Supabase client only if env vars are present
const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;


// --- Main Handler ---
module.exports = async (req, res) => {

  console.log(`Received request: ${req.method} ${req.url}`);

  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  const validation = validateRequest(req);
  if (validation.error) {
      if (validation.error.status === 405) res.setHeader("Allow", ["GET", "OPTIONS"]);
      return res.status(validation.error.status).json({ error: validation.error.message });
  }
  const { login } = validation;
  const shouldForceRefresh = req.query.forceRefresh === 'true';

  try {
      let userData = null;

      // Attempt to get from cache unless forcing refresh
      if (!shouldForceRefresh) {
          userData = await getUserFromCache(login);
      } else {
           console.log(`Force refresh requested for user: ${login}`);
      }

      // If not found in cache or forcing refresh, fetch from API
      if (!userData) {
          const apiUserData = await fetchUserFromAPI(login);
          upsertUserToCache(apiUserData); // Update cache in background
          userData = apiUserData; // Use fresh API data for the response
      }

      // Return the determined user data (either transformed cached or fresh API data)
      return res.status(200).json(userData);

  } catch (error) {
      console.error(`Error processing request for ${login}:`, error);
      const status = error.response?.status || 500;
      // Use a generic message for client-facing errors unless it's a 404
      const message = status === 404 ? "User not found" : "Failed to retrieve user data.";
      return res.status(status).json({ error: message });
  }
};


// --- Helper Functions ---

/**
 * Validates the incoming request method and login parameter.
 * @param {object} req - Vercel Request object
 * @returns {{login: string | null, error: {status: number, message: string} | null}}
 */
function validateRequest(req) {
    if (req.method === "OPTIONS") {
        return { login: null, error: { status: 200, message: "OPTIONS preflight" } };
    }
    if (req.method !== "GET") {
        return { login: null, error: { status: 405, message: "Method Not Allowed" } };
    }
    if (!supabase) {
        console.error("API Error: Supabase client not initialized.");
        return { login: null, error: { status: 500, message: "Server configuration error." } };
    }

    const { login } = req.query;
    if (!login || typeof login !== 'string' || !/^[a-zA-Z0-9_-]{2,20}$/.test(login)) {
        return { login: null, error: { status: 400, message: "Invalid or missing login parameter." } };
    }
    return { login, error: null };
}

/**
 * Attempts to retrieve user data from the Supabase cache.
 * @param {string} login - The user login.
 * @returns {Promise<object | null>} - The cached user data (transformed) or null if not found/error.
 */
async function getUserFromCache(login) {
    console.log(`Checking cache for user: ${login}`);
    try {
        const { data: cachedUser, error: selectError } = await supabase
            .from('users_cache')
            .select('*')
            .eq('login', login)
            .maybeSingle();

        if (selectError) {
            console.error(`Supabase select error for ${login}:`, selectError.message);
            return null; // Treat select error as cache miss
        }

        if (cachedUser) {
            console.log(`Cache hit for user: ${login}`);
            // Transform to match expected frontend structure
            return {
                ...cachedUser,
                image: { link: cachedUser.image_url }
            };
        }
    } catch (cacheError) {
        console.error(`Unexpected error checking cache for ${login}:`, cacheError);
    }
    console.log(`Cache miss for user: ${login}`);
    return null;
}

/**
 * Fetches fresh user data from the 42 API.
 * @param {string} login - The user login.
 * @returns {Promise<object>} - The user data from the API.
 * @throws {Error} - If API fetch fails.
 */
async function fetchUserFromAPI(login) {
    console.log(`Fetching from 42 API for user: ${login}`);
    const token = await tokenManager.getValidToken();
    const apiResponse = await retryRateLimitedRequest(() =>
        axios.get(`${API_BASE_URL}/users/${login}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
    );
    return apiResponse.data;
}

/**
 * Upserts user data into the Supabase cache asynchronously.
 * Does not wait for completion and logs errors.
 * @param {object} userData - User data fetched from the 42 API.
 */
function upsertUserToCache(userData) {
    const dataToUpsert = {
        login: userData.login,
        displayname: userData.displayname,
        email: userData.email,
        image_url: userData.image?.link, // Store the direct link
        wallet: userData.wallet,
        correction_points: userData.correction_point,
        cursus_users: userData.cursus_users,
        projects_users: userData.projects_users,
        last_refreshed_at: new Date().toISOString(),
    };

    // Perform upsert in background
    supabase
        .from('users_cache')
        .upsert(dataToUpsert, { onConflict: 'login' })
        .then(({ error: upsertError }) => {
            if (upsertError) {
                console.error(`Supabase background upsert error for ${userData.login}:`, upsertError.message);
            } else {
                console.log(`Successfully upserted ${userData.login} in background.`);
            }
        });
}


