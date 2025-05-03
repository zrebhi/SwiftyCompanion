const axios = require("axios");
const { Pool } = require("pg"); // Use Pool instead of Client
const { tokenManager } = require("../utils/tokenManager");
const { retryRateLimitedRequest } = require("../utils/retryRateLimitedRequest");

// --- Initialization ---
const DATABASE_URL = process.env.DATABASE_URL;
const API_BASE_URL = "https://api.intra.42.fr/v2";
const FULL_PROFILE_TTL = 3600000; // 1 hour in milliseconds

if (!DATABASE_URL) {
  console.error("API Login Error: Missing DATABASE_URL environment variable.");
}

// Configure the PostgreSQL Pool
// --- Certificate Loading ---
// Read certificate content from environment variable for Vercel deployment & local consistency
const caCertContent = process.env.SSL_CERT || null;

if (!caCertContent) {
  // Log an error if the env var is missing, critical for production/local if file reading is removed
  console.error("API Login Error: SSL_CERT environment variable is not set.");
} else {
  console.log(
    "Using Aiven CA certificate from environment variable for [login].js."
  );
}

// --- Clean Connection String ---
// Remove potentially conflicting sslmode from the DATABASE_URL before passing to Client
let cleanConnectionString = DATABASE_URL;
if (DATABASE_URL) {
  try {
    const url = new URL(DATABASE_URL);
    url.searchParams.delete("sslmode"); // Remove sslmode parameter
    // url.searchParams.delete('sslrootcert'); // Example if other params needed removal
    cleanConnectionString = url.toString();
    if (cleanConnectionString !== DATABASE_URL) {
      console.log("Removed sslmode from connection string for [login].js.");
    }
  } catch (e) {
    console.error("Error parsing DATABASE_URL:", e);
    // Proceed with original URL, might still fail
    cleanConnectionString = DATABASE_URL;
  }
}

// --- Initialize Connection Pool ---
// Create ONE pool instance per function instance (Vercel manages this)
const pool = cleanConnectionString
  ? new Pool({
      connectionString: cleanConnectionString, // Use the cleaned string
      // Configure SSL only if the certificate content is available from the env var
      ssl: caCertContent
        ? {
            ca: caCertContent,
            // rejectUnauthorized defaults to true, which is correct when providing a CA
          }
        : undefined, // If no CA cert, rely on system CAs (likely fails with Aiven PG) or connection fails
      // Add pool options here if needed (e.g., max, idleTimeoutMillis)
      // connectionTimeoutMillis: 2000, // default
    })
  : null;

// No need to explicitly connect the pool here.

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
  res.setHeader("Access-Control-Allow-Origin", "*"); // TODO: Restrict in production
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  const validation = validateRequest(req);
  if (validation.error) {
    if (validation.error.status === 405)
      res.setHeader("Allow", ["GET", "OPTIONS"]);
    // Handle OPTIONS preflight separately
    if (validation.error.status === 200 && req.method === "OPTIONS") {
      return res.status(200).end();
    }
    return res
      .status(validation.error.status)
      .json({ error: validation.error.message });
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
        console.error(
          `API fetch failed for ${login} after cache miss:`,
          apiError.message
        );
        const status = apiError.response?.status || 500;
        const message =
          status === 404 ? "User not found" : "Failed to retrieve user data.";
        return res.status(status).json({ error: message });
      }
    }

    // Check if cache has full data (using projects_users as indicator)
    // Ensure projects_users exists and is an array (could be null if fetched partially before)
    const hasFullData =
      cachedUser.projects_users && Array.isArray(cachedUser.projects_users);
    const isStale =
      !cachedUser.last_refreshed_at ||
      Date.now() - new Date(cachedUser.last_refreshed_at).getTime() >
        FULL_PROFILE_TTL;

    // Case 2: Cache Hit (Basic Info Only)
    if (!hasFullData) {
      console.log(
        `Cache hit for ${login} (basic info only). Fetching full profile from API.`
      );
      try {
        const apiUserData = await fetchUserFromAPI(login);
        await upsertUserToCache(apiUserData); // Update cache with full data
        return res.status(200).json(transformUserDataForResponse(apiUserData));
      } catch (apiError) {
        console.error(
          `API fetch failed for ${login} when fetching full profile:`,
          apiError.message
        );
        // Don't return basic info if full profile fetch fails
        const status = apiError.response?.status || 500;
        const message =
          status === 404
            ? "User not found"
            : "Failed to retrieve full user data.";
        return res.status(status).json({ error: message });
      }
    }

    // Case 3: Cache Hit (Full Info Exists)
    if (hasFullData) {
      // Subcase 3a: Full Info is Fresh
      if (!isStale) {
        console.log(
          `Cache hit for ${login} (full info, fresh). Returning cached data.`
        );
        return res.status(200).json(transformUserDataForResponse(cachedUser));
      }
      // Subcase 3b: Full Info is Stale
      else {
        console.log(
          `Cache hit for ${login} (full info, stale). Refreshing from API.`
        );
        try {
          const apiUserData = await fetchUserFromAPI(login);
          await upsertUserToCache(apiUserData); // Update cache
          return res
            .status(200)
            .json(transformUserDataForResponse(apiUserData));
        } catch (apiError) {
          console.error(
            `API refresh failed for stale user ${login}. Returning stale data. Error:`,
            apiError.message
          );
          // Return stale data if refresh fails
          return res.status(200).json(transformUserDataForResponse(cachedUser));
        }
      }
    }

    // Fallback for unexpected scenarios (shouldn't be reached with current logic)
    console.error(`Unexpected state reached for user ${login}.`);
    return res.status(500).json({ error: "Internal server error." });
  } catch (error) {
    // Catch errors from initial cache check or unexpected issues
    console.error(`Error processing request for ${login}:`, error);
    const status = error.response?.status || 500;
    // Use a generic message for client-facing errors unless it's a 404
    const message =
      status === 404 ? "User not found" : "Failed to retrieve user data.";
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
    return {
      login: null,
      error: { status: 200, message: "OPTIONS preflight" },
    };
  }
  if (req.method !== "GET") {
    return {
      login: null,
      error: { status: 405, message: "Method Not Allowed" },
    };
  }
  // Check if Pool initialized correctly
  if (!pool) {
    console.error(
      "API Login Error: PostgreSQL Pool not initialized (DATABASE_URL missing?)."
    );
    return {
      login: null,
      error: { status: 500, message: "Server configuration error." },
    };
  }

  const { login } = req.query;
  if (
    !login ||
    typeof login !== "string" ||
    !/^[a-zA-Z0-9_-]{2,20}$/.test(login)
  ) {
    return {
      login: null,
      error: { status: 400, message: "Invalid or missing login parameter." },
    };
  }
  return { login, error: null };
}

/**
 * Attempts to retrieve user data from the Supabase cache.
 * @param {string} login - The user login.
 * @returns {Promise<object | null>} - The RAW cached user data or null if not found/error.
 */
async function getUserFromCache(login) {
  if (!pool) {
    console.error("getUserFromCache Error: PostgreSQL Pool not initialized.");
    return null; // Cannot proceed without a pool
  }
  console.log(`Checking cache for user: ${login}`);
  // Get a client from the pool, execute query, release client
  const client = await pool.connect();
  try {
    const sql = `SELECT * FROM users_cache WHERE login = $1`;
    const params = [login];
    const { rows } = await client.query(sql, params);

    if (rows && rows.length > 0) {
      console.log(`Cache hit for user: ${login}`);
      // Since login is PRIMARY KEY, we expect 0 or 1 row.
      return rows[0]; // Return the single user record found.
    }
  } catch (dbError) {
    console.error(`PostgreSQL select error for ${login}:`, dbError.message);
    // Don't throw, just treat as cache miss
  } finally {
    client.release(); // IMPORTANT: Release client back to pool
  }
  console.log(`Cache miss for user: ${login}`);
  return null; // Return null if no user found or if there was a DB error.
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
    throw new Error(
      `Invalid API response structure received for user ${login}`
    );
  }
  return apiResponse.data;
}

/**
 * Upserts FULL user data into the Supabase cache.
 * Waits for completion and throws error on failure.
 * @param {object} userData - User data fetched from the 42 API.
 * @returns {Promise<void>}
 * @throws {Error} - If PostgreSQL upsert fails.
 */
async function upsertUserToCache(userData) {
  if (!pool) {
    console.error("upsertUserToCache Error: PostgreSQL Pool not initialized.");
    throw new Error("Database pool not available, cannot upsert cache.");
  }
  console.log(`Upserting user ${userData.login} to cache.`);
  // Ensure we have the necessary fields from the API data
  if (!userData || !userData.login) {
    console.error("Attempted to upsert invalid user data:", userData);
    throw new Error("Invalid user data provided for caching.");
  }

  // Prepare data, ensuring JSON fields are stringified if needed by pg driver
  // (pg driver usually handles JS objects -> JSONB automatically)
  const dataToUpsert = {
    login: userData.login,
    displayname: userData.displayname,
    email: userData.email,
    image_url: userData.image?.link, // Store the direct link from API structure
    wallet: userData.wallet,
    correction_points: userData.correction_point, // Use the correct column name
    cursus_users: userData.cursus_users, // Assumes this is already a JS object/array
    projects_users: userData.projects_users, // Assumes this is already a JS object/array
    last_refreshed_at: new Date().toISOString(),
  };

  // Construct the UPSERT query
  const fields = Object.keys(dataToUpsert).filter(
    (key) => dataToUpsert[key] !== undefined
  );
  const valuesPlaceholders = fields.map((_, i) => `$${i + 1}`).join(", ");
  // Use EXCLUDED."column_name" syntax for ON CONFLICT DO UPDATE for JSONB and other types
  const updateSet = fields
    .filter((key) => key !== "login") // Don't update the primary key
    .map((key) => `"${key}" = EXCLUDED."${key}"`) // Use EXCLUDED to get the value proposed for insertion
    .join(", ");

  const sql = `
        INSERT INTO users_cache (${fields.map((f) => `"${f}"`).join(", ")})
        VALUES (${valuesPlaceholders})
        ON CONFLICT (login) DO UPDATE SET
          ${updateSet};
    `;
  // Prepare the values array, ensuring JSONB fields are stringified
  const queryParams = fields.map((key) => {
    const value = dataToUpsert[key];
    // Explicitly stringify fields intended for JSONB columns
    if (key === "cursus_users" || key === "projects_users") {
      // Handle null/undefined cases before stringifying
      return value ? JSON.stringify(value) : null;
    }
    return value;
  });

  // Get a client from the pool, execute query, release client
  const client = await pool.connect();
  try {
    await client.query(sql, queryParams);
    console.log(`Successfully upserted ${userData.login}.`);
  } catch (dbError) {
    console.error(
      `PostgreSQL upsert error for ${userData.login}:`,
      dbError.message
    );
    // Optionally re-throw or handle differently depending on desired behavior on cache update failure
    throw new Error(`Failed to update cache for user ${userData.login}.`);
  } finally {
    client.release(); // IMPORTANT: Release client back to pool
  }
}
