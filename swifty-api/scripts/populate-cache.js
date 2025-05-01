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
const API_PAGE_FETCH_DELAY_MS = 550; // Delay between 42 API page fetches (ms)
const UPSERT_BATCH_SIZE = 100; // Number of users to upsert in a single batch
const BATCH_DELAY_MS = 200; // Optional delay between Supabase batch upserts (ms)

// --- Initialization ---
// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    `Error: Missing required environment variables (SUPABASE_URL, SUPABASE_SERVICE_KEY, CLIENT_ID, CLIENT_SECRET). Check your root .env file.`
  );
  process.exit(1);
}
// Initialize PostgreSQL client
const { Client } = require('pg');
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// --- Helper Functions ---

/**
 * Fetches all active user logins using pagination.
 * Returns the basic user data directly from the list endpoint.
 * @returns {Promise<object[]>} - A list of user objects containing basic info.
 */
async function fetchAllUserLogins() { 
 let allUsers = [];
 let page = 1;
 const perPage = 100;

 console.log(
   `Fetching all active user logins from ${API_BASE_URL}/users ...` // Updated log
 );

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

      // Filter for active users client-side
      const activeUsers = usersOnPage.filter(
        (user) => user["active?"] === true
      );
      allUsers = allUsers.concat(activeUsers);
      console.log(
        `Fetched ${usersOnPage.length}, added ${activeUsers.length} active. Total collected: ${allUsers.length}`
      );

      if (usersOnPage.length < perPage) {
        console.log("Last page reached.");
        break;
      }
      page++;
      // Apply delay before fetching the next page to respect rate limits
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
        // Retry same page
      } else {
        console.error("Non-recoverable error fetching user list. Stopping.");
        throw error;
      }
    }
  }
  console.log(
    `Finished fetching user list. Total collected: ${allUsers.length}`
  );
  return allUsers;
}

/**
 * Iterates through user objects, prepares basic data, and upserts them in batches.
 * @param {object[]} users - Array of user objects from fetchAllUserLogins.
 */
async function processUsersBatch(users) {
  const totalUsers = users.length;
  let batch = [];
  console.log(`\nStarting batch upsert process for ${totalUsers} users...`);

  for (let i = 0; i < totalUsers; i++) {
    const user = users[i];
    const currentCount = i + 1;

    // Prepare data object for upsert, matching Supabase schema columns
    // Only include fields available directly from the /v2/users list endpoint
    const userData = {
      login: user.login, // Primary Key
      displayname: user.displayname,
      // Use image.link if available, otherwise null or a default/placeholder
      image_url: user.image?.link || user.image?.versions?.small || null,
      last_refreshed_at: new Date().toISOString(),
    };

    batch.push(userData);

    // If batch is full or it's the last user, upsert the batch
    if (batch.length >= UPSERT_BATCH_SIZE || currentCount === totalUsers) {
      console.log(
        `[${currentCount}/${totalUsers}] Upserting batch of ${batch.length} users...`
      );
      try {
        // Upsert based on the 'login' primary key
        const { error } = await supabase.from("users_cache").upsert(batch, {
          onConflict: "login", // Correct conflict target based on schema
          // ignoreDuplicates: false // default is false, upsert will update existing rows
        });

        if (error) {
          console.error(`Supabase upsert error: ${error.message}`);
          // Decide if you want to stop or continue on batch error
        } else {
          console.log(`---> Batch upsert successful.`);
        }
        // Clear the batch
        batch = [];
        // Optional delay between batches
        if (currentCount < totalUsers && BATCH_DELAY_MS > 0) {
          console.log(`--- Delaying ${BATCH_DELAY_MS}ms before next batch ---`);
          await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
        }
      } catch (err) {
        console.error("Unexpected error during Supabase batch upsert:", err);
        // Decide how to handle unexpected errors
      }
    }
  }
  console.log(`Finished processing loop for ${totalUsers} users.`);
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
      `Fetching list of all active user logins...` // Updated log
    );
    // *** Call fetchAllUserLogins ***
    const allUsers = await fetchAllUserLogins();
    console.log(`Found ${allUsers.length} active users to process.`); // Updated log

    if (allUsers.length === 0) {
      console.log("No active users found. Exiting."); // Updated log
      return;
    }

    // --- Step 2: Process users and upsert basic info to Supabase in batches ---
    // Estimate time based on batches and delay
    const estimatedBatches = Math.ceil(allUsers.length / UPSERT_BATCH_SIZE);
    const estimatedTimeMinutes = Math.ceil((estimatedBatches * BATCH_DELAY_MS) / 1000 / 60);
    // Updated log to reflect batch processing and remove old delay constant
    console.log(`\n---> Ready to process ${allUsers.length} users in batches of ${UPSERT_BATCH_SIZE}. Estimated time: ~${estimatedTimeMinutes} minutes (excluding API fetch time).`);

    // *** Call processUsersBatch ***
    await processUsersBatch(allUsers); // Call the new function with user objects

    console.log("\nCache population script finished successfully.");
  } catch (error) {
    console.error("Error during cache population:", error);
    process.exit(1); // Exit with error code
  }
}

// --- Run Script ---
main();
