// swifty-api/scripts/populate-cache.js
// Script to fetch all relevant user data from 42 API and populate the Supabase cache.
// Run manually via: node swifty-api/scripts/populate-cache.js

require("dotenv").config({ path: "../../.env" }); // Load vars from root .env relative to project root
const { createClient } = require("@supabase/supabase-js");
const axios = require("axios");
const { tokenManager } = require("../api/utils/tokenManager");

// --- Configuration ---
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // Use service key for admin rights
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const API_BASE_URL = "https://api.intra.42.fr/v2";
const CAMPUS_ID = 1; // Target Campus ID (e.g., 9 for Lyon). ADJUST AS NEEDED!
const RATE_LIMIT_DELAY_MS = 550; // Delay between individual user API calls (ms)

// --- Initialization ---
// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    `Error: Missing required environment variables (SUPABASE_URL, SUPABASE_SERVICE_KEY, CLIENT_ID, CLIENT_SECRET). Check your root .env file.`
  );
  process.exit(1);
}
// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// --- Helper Functions ---

/**
 * Fetches all active, non-alumni user logins for a specific primary campus using pagination.
 * @param {number} campusId - The ID of the primary campus to filter by.
 * @returns {Promise<string[]>} - A list of user logins.
 */
async function fetchAllUserLogins(campusId) {
  let allLogins = [];
  let page = 1;
  const perPage = 100;

  console.log(
    `Fetching logins for primary campus ${campusId} from ${API_BASE_URL}/users ...`
  );

  while (true) {
    try {
      const token = await tokenManager.getValidToken();
      const params = new URLSearchParams({
        "filter[primary_campus_id]": campusId,
        // "filter[active]": 'true', // Filter active users client-side for reliability
        "page[number]": page,
        "page[size]": perPage,
      });
      const url = `${API_BASE_URL}/users?${params.toString()}`;

      console.log(`Fetching page ${page}...`);
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const usersOnPage = response.data;
      if (!usersOnPage || usersOnPage.length === 0) {
        console.log("No more users found on this page.");
        break;
      }

      // Filter for active users client-side
      const activeUsers = usersOnPage.filter(user => user['active?'] === true);
      const logins = activeUsers.map((user) => user.login);
      allLogins = allLogins.concat(logins);
      console.log(
        `Fetched ${usersOnPage.length}, added ${logins.length} active. Total collected: ${allLogins.length}`
      );

      if (usersOnPage.length < perPage) {
        console.log("Last page reached.");
        break;
      }
      page++;
      // Optional delay between page fetches if needed
      // await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Error fetching page ${page}:`, error.response?.status, error.message);
      if (error.response?.status === 429) {
        console.log("Rate limited (429) fetching user list page. Waiting 1s...");
        await new Promise((resolve) => setTimeout(resolve, 1000));
        // Retry same page
      } else {
        console.error("Non-recoverable error fetching user list. Stopping.");
        throw error;
      }
    }
  }
  console.log(`Finished fetching logins. Total collected: ${allLogins.length}`);
  return allLogins;
}

/**
 * Maps raw 42 API user data to the Supabase table schema.
 * @param {object} userData - Raw data object from 42 API /v2/users/{login}.
 * @returns {object} - Data object ready for Supabase upsert.
 */
function prepareDataForUpsert(userData) {
    return {
        login: userData.login,
        displayname: userData.displayname,
        email: userData.email,
        image_url: userData.image?.link, // Use optional chaining
        wallet: userData.wallet,
        correction_points: userData.correction_point,
        // location field removed
        cursus_users: userData.cursus_users,
        projects_users: userData.projects_users,
        last_refreshed_at: new Date().toISOString(),
    };
}

/**
 * Processes a single login: checks cache, fetches API if needed, upserts data.
 * @param {string} login - The user login to process.
 * @returns {Promise<boolean>} - True if an API call was attempted, false otherwise.
 */
async function processSingleLogin(login) {
    let existingUser = null;
    let selectError = null;
    let apiCallAttempted = false;

    try {
      // Check cache first
      ({ data: existingUser, error: selectError } = await supabase
        .from("users_cache")
        .select("login") // Check existence only
        .eq("login", login)
        .maybeSingle());

      if (selectError) {
        console.error(`DB check error for ${login}: ${selectError.message}. Skipping.`);
        return false; // Indicate no API call needed/attempted
      }

      if (existingUser) {
        // Log skip, return false as no API call needed
        return false;
      }

      // --- User not in cache, fetch from API ---
      apiCallAttempted = true; // Mark API call attempt
      const token = await tokenManager.getValidToken();
      const userUrl = `${API_BASE_URL}/users/${login}`;

      const response = await axios.get(userUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = response.data;

      // Prepare and Upsert data
      const dataToUpsert = prepareDataForUpsert(userData);
      const { error: upsertError } = await supabase
        .from("users_cache")
        .upsert(dataToUpsert, { onConflict: "login" });

      if (upsertError) {
        console.error(`DB upsert error for ${login}: ${upsertError.message}.`);
        // Logged error, but still count as processed for progress
      } else {
        // Log success only if upsert was successful
        // console.log(`---> User ${login} successfully fetched and upserted.`);
      }

    } catch (error) {
      // Handle API fetch errors
      console.error(`API fetch/processing error for ${login}:`, error.response?.status, error.message);
      if (error.response?.status === 429) {
        console.log(`Rate limited (429) processing ${login}. Will retry after delay.`);
        // Let the main loop handle the delay based on apiCallAttempted flag
      } else if (error.response?.status === 404) {
        console.warn(`User ${login} not found (404) during API fetch. Skipping.`);
        // No need to retry, but API call was attempted
      } else {
        // Log other unexpected errors
        console.error(`Unexpected error for ${login}. Skipping.`);
      }
    }
    // Return whether an API call was attempted (important for delay logic)
    return apiCallAttempted;
}


/**
 * Iterates through logins, processes each, and handles rate limiting.
 * @param {string[]} logins - Array of user logins to process.
 */
async function processAllLogins(logins) {
  const totalLogins = logins.length;
  for (let i = 0; i < totalLogins; i++) {
    const login = logins[i];
    const currentCount = i + 1;

    console.log(`[${currentCount}/${totalLogins}] Processing ${login}...`);

    const apiCallMade = await processSingleLogin(login);

    if (apiCallMade) {
       console.log(`---> Processed ${login} (API call made).`);
       // Apply delay only if an API call was attempted and it's not the last user
       if (currentCount < totalLogins) {
           console.log(`--- Delaying ${RATE_LIMIT_DELAY_MS}ms ---`);
           await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY_MS));
       }
    } else {
        // Log skips clearly
        console.log(`---> Skipped ${login} (already cached or error during check).`);
    }
  }
  console.log(`Finished processing loop for ${totalLogins} logins.`);
}


// --- Main Script Logic ---
async function main() {
  console.log("Starting Supabase cache population script...");

  try {
    // Get 42 API token (handled by tokenManager)
    console.log("Fetching initial 42 API token...");
    await tokenManager.getValidToken(); // Initial fetch if needed
    console.log("Token obtained.");

    // --- Step 1: Fetch all relevant user logins ---
    console.log(
      `Fetching list of active user logins for campus ${CAMPUS_ID}...`
    );
    // *** Call fetchAllUserLogins ***
    const allLogins = await fetchAllUserLogins(CAMPUS_ID);
    console.log(`Found ${allLogins.length} active logins to process.`);

    if (allLogins.length === 0) {
      console.log("No logins found. Exiting.");
      return;
    }

    // --- Step 2: Fetch full details and upsert to Supabase ---
    // Log the count clearly before starting the potentially long process
    console.log(
      `\n---> Ready to fetch full details for ${
        allLogins.length
      } users. This may take approximately ${Math.ceil(
        (allLogins.length * RATE_LIMIT_DELAY_MS) / 1000 / 60
      )} minutes.`
    );

    console.log("\nStarting detail fetching and upsert process...");
    // *** Call processAllLogins ***
    await processAllLogins(allLogins);

    console.log("\nCache population script finished successfully.");
  } catch (error) {
    console.error("Error during cache population:", error);
    process.exit(1); // Exit with error code
  }
}

// --- Run Script ---
main();
