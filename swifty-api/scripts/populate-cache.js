// swifty-api/scripts/populate-cache.js
// Run manually via: node swifty-api/scripts/populate-cache.js

require("dotenv").config({ path: "../../.env" });
const { Pool } = require("pg"); // Use pg Pool
const axios = require("axios");
const { tokenManager } = require("../api/utils/tokenManager");

const DATABASE_URL = process.env.DATABASE_URL;
const SSL_CERT_CONTENT = process.env.SSL_CERT || null;
const CLIENT_ID = process.env.CLIENT_ID; // Use bracket notation for env var starting with number
const CLIENT_SECRET = process.env.CLIENT_SECRET; // Use bracket notation for env var starting with number
const API_BASE_URL = "https://api.intra.42.fr/v2";
const API_PAGE_FETCH_DELAY_MS = 550; // Delay between 42 API page fetches
const UPSERT_BATCH_SIZE = 100; // Number of users to upsert per DB transaction
const BATCH_DELAY_MS = 200; // Optional delay between DB batch upserts

// --- Initialization & Validation ---
if (!DATABASE_URL || !CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    `Error: Missing required environment variables (DATABASE_URL, CLIENT_ID, CLIENT_SECRET). Check your root .env file.`
  );
  process.exit(1);
}
if (!SSL_CERT_CONTENT) {
  console.warn(
    "Warning: SSL_CERT environment variable is not set. DB connection might fail if SSL is required."
  );
}

let cleanConnectionString = DATABASE_URL;
if (DATABASE_URL) {
  try {
    const url = new URL(DATABASE_URL);
    url.searchParams.delete("sslmode");
    cleanConnectionString = url.toString();
    if (cleanConnectionString !== DATABASE_URL) {
      // console.log("Removed sslmode from connection string for populate-cache script."); // Optional: Keep for debugging if needed
    }
  } catch (e) {
    console.error("Error parsing DATABASE_URL:", e);
    cleanConnectionString = DATABASE_URL;
  }
}

const pool = cleanConnectionString
  ? new Pool({
      connectionString: cleanConnectionString,
      ssl: SSL_CERT_CONTENT ? { ca: SSL_CERT_CONTENT } : undefined,
    })
  : null;

if (!pool) {
  console.error("Error: Failed to initialize PostgreSQL Pool. Exiting.");
  process.exit(1);
}

// --- Helper Functions ---

/**
 * Checks if the users_cache table exists and creates it if not.
 * @param {Pool} dbPool - The pg Pool instance.
 */
async function ensureTableExists(dbPool) {
  const createTableQuery = `
        CREATE TABLE IF NOT EXISTS users_cache (
            login VARCHAR(255) PRIMARY KEY,
            displayname VARCHAR(255),
            email VARCHAR(255),
            image_url TEXT,
            wallet INTEGER,
            correction_points INTEGER,
            cursus_users JSONB,
            projects_users JSONB,
            last_refreshed_at TIMESTAMPTZ
        );
    `;
  let client;
  try {
    client = await dbPool.connect();
    await client.query(createTableQuery);
    console.log("Ensured 'users_cache' table exists.");
  } catch (err) {
    console.error("Error ensuring users_cache table exists:", err);
    throw err; // Stop the script if table creation fails
  } finally {
    if (client) client.release();
  }
}

/**
 * Fetches all active user logins using pagination.
 * Returns the basic user data directly from the list endpoint.
 * @returns {Promise<object[]>} - A list of user objects containing basic info.
 */
async function fetchAllUserLogins() {
  let allUsers = [];
  let page = 1;
  const perPage = 100; // Fetch 100 per page from API
  // const TEST_USER_LIMIT = 50; // For testing purposes, limit to 50 users

  console.log(`Fetching all active user logins from ${API_BASE_URL}/users ...`);

  while (true) {
    try {
      const token = await tokenManager.getValidToken();
      const params = new URLSearchParams({
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

      // Filter for active users (API doesn't seem to support server-side filtering for this)
      const activeUsers = usersOnPage.filter(
        (user) => user["active?"] === true
      );
      allUsers = allUsers.concat(activeUsers);
      console.log(
        `Fetched page ${page} (${usersOnPage.length} users), added ${activeUsers.length} active. Total collected: ${allUsers.length}`
      );

      /* // --- Stop fetching if test limit reached ---
      if (allUsers.length >= TEST_USER_LIMIT) {
        console.warn(
          `Reached test limit of ${TEST_USER_LIMIT} users. Stopping API fetch.`
        );
        break; // Exit the while loop
      }
      // ----------------------------------------- */

      if (usersOnPage.length < perPage) {
        console.log("Last page reached.");
        break;
      }
      page++;
      // Delay before fetching the next page to respect 42 API rate limits
      if (API_PAGE_FETCH_DELAY_MS > 0) {
        console.log(
          `--- Delaying ${API_PAGE_FETCH_DELAY_MS}ms before next API page fetch ---`
        );
        await new Promise((resolve) =>
          setTimeout(resolve, API_PAGE_FETCH_DELAY_MS)
        );
      }
    } catch (error) {
      console.error(
        `Error fetching page ${page}:`,
        error.response?.status,
        error.message
      );
      if (error.response?.status === 429) {
        console.log(
          "Rate limited (429) fetching user list page. Waiting 1s..."
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
        // Retry the same page after a delay
      } else {
        console.error("Non-recoverable error fetching user list. Stopping.");
        throw error;
      }
    }
  }
  console.log(
    `Finished fetching user list. Total active users collected: ${allUsers.length}`
  );
  return allUsers;
}

/**
 * Iterates through user objects, prepares basic data, and upserts them in batches using pg.
 * @param {Pool} dbPool - The pg Pool instance.
 * @param {object[]} users - Array of user objects from fetchAllUserLogins.
 */
async function processUsersBatch(dbPool, users) {
  const totalUsers = users.length;
  let batch = [];
  console.log(`\nStarting batch upsert process for ${totalUsers} users...`);

  for (let i = 0; i < totalUsers; i++) {
    const user = users[i];
    const currentCount = i + 1;

    // Prepare data object for upsert, matching users_cache table columns
    // Only include fields readily available from the /v2/users list endpoint for this initial population
    const userData = {
      login: user.login, // Primary Key
      displayname: user.displayname,
      // Use image.link or small version if available
      image_url: user.image?.link || user.image?.versions?.small || null,
      last_refreshed_at: new Date().toISOString(),
    };

    batch.push(userData);

    // If batch is full or it's the last user, execute the batch upsert
    if (batch.length >= UPSERT_BATCH_SIZE || currentCount === totalUsers) {
      console.log(
        `[${currentCount}/${totalUsers}] Upserting batch of ${batch.length} users...`
      );
      let client;
      try {
        // Construct batch INSERT ... ON CONFLICT query
        const fields = [
          "login",
          "displayname",
          "image_url",
          "last_refreshed_at",
        ];
        const numFields = fields.length;
        const numRows = batch.length;
        const valuesPlaceholders = [];
        const queryParams = [];

        for (let i = 0; i < numRows; i++) {
          const rowPlaceholders = [];
          for (let j = 0; j < numFields; j++) {
            rowPlaceholders.push(`$${i * numFields + j + 1}`);
            queryParams.push(batch[i][fields[j]]);
          }
          valuesPlaceholders.push(`(${rowPlaceholders.join(", ")})`);
        }

        // Define columns to update on conflict (excluding the primary key 'login')
        const updateSet = fields
          .filter((key) => key !== "login")
          .map((key) => `"${key}" = EXCLUDED."${key}"`)
          .join(", ");

        const sql = `
            INSERT INTO users_cache (${fields.map((f) => `"${f}"`).join(", ")})
            VALUES ${valuesPlaceholders.join(", ")}
            ON CONFLICT (login) DO UPDATE SET
              ${updateSet};
        `;

        client = await dbPool.connect();
        await client.query(sql, queryParams);
        console.log(`---> Batch upsert successful.`);
      } catch (err) {
        console.error(
          `Error during PostgreSQL batch upsert (batch starting user index ${
            i - batch.length + 1
          }):`,
          err.message
        );
        // Log error and continue with the next batch
      } finally {
        if (client) client.release();
        // Clear the batch regardless of success/failure to prepare for the next one
        batch = [];
        // Optional delay between DB batches
        if (currentCount < totalUsers && BATCH_DELAY_MS > 0) {
          console.log(`--- Delaying ${BATCH_DELAY_MS}ms before next batch ---`);
          await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
        }
      }
    }
  }
  console.log(`Finished processing loop for ${totalUsers} users.`);
}

// --- Main Script Logic ---
async function main() {
  console.log("Starting PostgreSQL cache population script...");

  // mainClient variable removed as pool is used directly or via short-lived clients
  try {
    console.log("Ensuring database table exists...");
    await ensureTableExists(pool);
    console.log("Database ready.");

    console.log("Fetching initial 42 API token...");
    await tokenManager.getValidToken();
    console.log("Token obtained.");

    // --- Step 1: Fetch all relevant user logins ---
    console.log(`Fetching list of all active user logins...`);
    const allUsers = await fetchAllUserLogins();
    console.log(`Found ${allUsers.length} active users to process.`);

    if (allUsers.length === 0) {
      console.log("No active users found. Exiting.");
      return;
    }

    // --- Step 2: Process users and upsert basic info to DB in batches ---
    const estimatedBatches = Math.ceil(allUsers.length / UPSERT_BATCH_SIZE);
    const estimatedTimeMinutes = Math.ceil(
      (estimatedBatches * BATCH_DELAY_MS) / 1000 / 60
    );
    console.log(
      `\n---> Ready to process ${allUsers.length} users in ${estimatedBatches} batches of ${UPSERT_BATCH_SIZE}. Estimated DB time: ~${estimatedTimeMinutes} minutes.`
    );

    await processUsersBatch(pool, allUsers);

    console.log("\nCache population script finished successfully.");
  } catch (error) {
    console.error("Error during cache population:", error.message);
    process.exit(1);
  } finally {
    if (pool) {
      console.log("Closing database connection pool...");
      await pool.end(); // Ensure pool is closed on success or error
      console.log("Database pool closed.");
    }
  }
}

// --- Run Script ---
main();
