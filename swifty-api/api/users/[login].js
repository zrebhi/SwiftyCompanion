const axios = require("axios");
const { createClient } = require('@supabase/supabase-js');
const { tokenManager } = require("../utils/tokenManager");
const { retryRateLimitedRequest } = require("../utils/retryRateLimitedRequest");

// --- Initialization ---
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const API_BASE_URL = "https://api.intra.42.fr/v2";
const FULL_PROFILE_TTL = 3600000; // 1 hour in milliseconds

// Initialize Supabase client only if env vars are present
const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;


// --- Helper Function for Response Formatting ---
function transformUserDataForResponse(userData) {
    if (!userData) return null;
    // Ensure image structure matches frontend expectation
    // Handles both raw API data (userData.image.link) and cache data (userData.image_url)
    const imageUrl = userData.image?.link || userData.image_url;
    const { image_url, image, ...rest } = userData; // Remove original image/image_url
    return { ...rest, image: { link: imageUrl } }; // Add formatted image field
}

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
      // Handle OPTIONS preflight separately
      if (validation.error.status === 200 && req.method === "OPTIONS") {
          return res.status(200).end();
      }
      return res.status(validation.error.status).json({ error: validation.error.message });
  }
  const { login } = validation;

  try {
      const cachedUser = await getUserFromCache(login);

      // Case 1: Cache Miss
      if (!cachedUser) {
          console.log(`Cache miss for ${login}. Fetching from API.`);
          try {
              const apiUserData = await fetchUserFromAPI(login);
              await upsertUserToCache(apiUserData); // Wait for cache update
              return res.status(200).json(transformUserDataForResponse(apiUserData));
          } catch (apiError) {
              console.error(`API fetch failed for ${login} after cache miss:`, apiError.message);
              const status = apiError.response?.status || 500;
              const message = status === 404 ? "User not found" : "Failed to retrieve user data.";
              return res.status(status).json({ error: message });
          }
      }

      // Check if cache has full data (using projects_users as indicator)
      // Ensure projects_users exists and is an array (could be null if fetched partially before)
      const hasFullData = cachedUser.projects_users && Array.isArray(cachedUser.projects_users);
      const isStale = !cachedUser.last_refreshed_at || (Date.now() - new Date(cachedUser.last_refreshed_at).getTime()) > FULL_PROFILE_TTL;

      // Case 2: Cache Hit (Basic Info Only)
      if (!hasFullData) {
          console.log(`Cache hit for ${login} (basic info only). Fetching full profile from API.`);
          try {
              const apiUserData = await fetchUserFromAPI(login);
              await upsertUserToCache(apiUserData); // Update cache with full data
              return res.status(200).json(transformUserDataForResponse(apiUserData));
          } catch (apiError) {
              console.error(`API fetch failed for ${login} when fetching full profile:`, apiError.message);
              // Don't return basic info if full profile fetch fails
              const status = apiError.response?.status || 500;
              const message = status === 404 ? "User not found" : "Failed to retrieve full user data.";
              return res.status(status).json({ error: message });
          }
      }

      // Case 3: Cache Hit (Full Info Exists)
      if (hasFullData) {
          // Subcase 3a: Full Info is Fresh
          if (!isStale) {
              console.log(`Cache hit for ${login} (full info, fresh). Returning cached data.`);
              return res.status(200).json(transformUserDataForResponse(cachedUser));
          }
          // Subcase 3b: Full Info is Stale
          else {
              console.log(`Cache hit for ${login} (full info, stale). Refreshing from API.`);
              try {
                  const apiUserData = await fetchUserFromAPI(login);
                  await upsertUserToCache(apiUserData); // Update cache
                  return res.status(200).json(transformUserDataForResponse(apiUserData));
              } catch (apiError) {
                  console.error(`API refresh failed for stale user ${login}. Returning stale data. Error:`, apiError.message);
                  // Return stale data if refresh fails
                  return res.status(200).json(transformUserDataForResponse(cachedUser));
              }
          }
      }

      // Fallback for unexpected scenarios (shouldn't be reached with current logic)
      console.error(`Unexpected state reached for user ${login}.`);
      return res.status(500).json({ error: "Internal server error." });

  } catch (error) { // Catch errors from initial cache check or unexpected issues
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
    // Allow OPTIONS for CORS preflight
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
 * @returns {Promise<object | null>} - The RAW cached user data or null if not found/error.
 */
async function getUserFromCache(login) {
    console.log(`Checking cache for user: ${login}`);
    try {
        const { data: cachedUser, error: selectError } = await supabase
            .from('users_cache')
            .select('*') // Select all columns including last_refreshed_at, projects_users etc.
            .eq('login', login)
            .maybeSingle();

        if (selectError) {
            console.error(`Supabase select error for ${login}:`, selectError.message);
            return null; // Treat select error as cache miss
        }

        if (cachedUser) {
            console.log(`Cache hit for user: ${login}`);
            return cachedUser; // Return raw data including last_refreshed_at etc.
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
    // Basic validation of API response structure
    if (!apiResponse || !apiResponse.data || !apiResponse.data.login) {
        throw new Error(`Invalid API response structure received for user ${login}`);
    }
    return apiResponse.data;
}

/**
 * Upserts FULL user data into the Supabase cache.
 * Waits for completion and throws error on failure.
 * @param {object} userData - User data fetched from the 42 API.
 * @returns {Promise<void>}
 * @throws {Error} - If Supabase upsert fails.
 */
async function upsertUserToCache(userData) {
    console.log(`Upserting user ${userData.login} to cache.`);
    // Ensure we have the necessary fields from the API data
    if (!userData || !userData.login) {
        console.error("Attempted to upsert invalid user data:", userData);
        throw new Error("Invalid user data provided for caching.");
    }

    const dataToUpsert = {
        login: userData.login,
        displayname: userData.displayname,
        email: userData.email,
        image_url: userData.image?.link, // Store the direct link from API structure
        wallet: userData.wallet,
        correction_points: userData.correction_point,
        cursus_users: userData.cursus_users,
        projects_users: userData.projects_users,
        // Add any other relevant fields from the full API response here
        last_refreshed_at: new Date().toISOString(),
    };

    // Remove undefined fields to avoid Supabase issues
    Object.keys(dataToUpsert).forEach(key => dataToUpsert[key] === undefined && delete dataToUpsert[key]);

    const { error: upsertError } = await supabase
        .from('users_cache')
        .upsert(dataToUpsert, { onConflict: 'login' }); // Use login as the conflict target

    if (upsertError) {
        console.error(`Supabase upsert error for ${userData.login}:`, upsertError.message);
        throw new Error(`Failed to update cache for user ${userData.login}.`);
    }
    console.log(`Successfully upserted ${userData.login}.`);
}
