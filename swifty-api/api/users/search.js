// swifty-api/api/users/search.js
const { Pool } = require("pg"); // Use Pool instead of Client
const { performance } = require("perf_hooks"); // For timing queries

// Initialize PostgreSQL Pool Configuration
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("API Search Error: Missing DATABASE_URL environment variable.");
}

// Configure the PostgreSQL Pool
// Uses PostgreSQL Pool for database connections.
// --- Certificate Loading ---
// Read certificate content from environment variable for Vercel deployment & local consistency
const caCertContent = process.env.SSL_CERT || null;

if (!caCertContent) {
  // Log an error if the env var is missing, critical for production/local if file reading is removed
  console.error("API Search Error: SSL_CERT environment variable is not set.");
} else {
  console.log(
    "Using Aiven CA certificate from environment variable for search.js."
  );
}

// --- Clean Connection String ---
// Remove potentially conflicting sslmode from the DATABASE_URL before passing to Pool config
let cleanConnectionString = DATABASE_URL;
if (DATABASE_URL) {
  try {
    const url = new URL(DATABASE_URL);
    url.searchParams.delete("sslmode"); // Remove sslmode parameter
    // url.searchParams.delete('sslrootcert'); // Example if other params needed removal
    cleanConnectionString = url.toString();
    if (cleanConnectionString !== DATABASE_URL) {
      console.log("Removed sslmode from connection string for search.js.");
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

// No need to explicitly connect the pool here. It connects on first query.

const MAX_SUGGESTIONS = 10;
// MAX_SUGGESTIONS limits the total results returned.

/**
 * Performs a tiered search for user suggestions based on a search term.
 *
 * @async
 * @param {object} pool - Initialized pg.Pool instance.
 * @param {string} searchTerm - The term to search for.
 * @param {number} maxSuggestions - The maximum number of suggestions to return.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of suggestion objects.
 */
async function sortSearchSuggestions(pool, searchTerm, maxSuggestions) {
  if (!pool) {
    console.error(
      "sortSearchSuggestions Error: PostgreSQL Pool not initialized."
    );
    return [];
  }

  const tierStartTime = performance.now();
  try {
    // Use CTEs (WITH clauses) and ROW_NUMBER() to rank and limit per tier
    const sql = `
      WITH RankedUsers AS (
        -- First CTE: Calculate the rank for each user based on search term match type
        SELECT
          login,
          displayname,
          image_url,
          CASE
            WHEN login ILIKE $1 THEN 1       -- Tier 1: Login starts with
            WHEN displayname ILIKE $1 THEN 2 -- Tier 2: DisplayName starts with
            WHEN login ILIKE $2 THEN 3       -- Tier 3: Login contains
            WHEN displayname ILIKE $2 THEN 4 -- Tier 4: DisplayName contains
            ELSE 5                          -- Should not happen with WHERE clause, but good practice
          END as rank
        FROM
          users_cache
        WHERE
          login ILIKE $2 OR displayname ILIKE $2 -- Pre-filter: Only consider users matching the 'contains' criteria
      ),
      NumberedUsers AS (
        -- Second CTE: Assign a row number within each rank group, ordered appropriately
        SELECT
          login,
          displayname,
          image_url,
          rank,
          ROW_NUMBER() OVER (
            PARTITION BY rank -- Reset numbering for each rank group
            ORDER BY
              -- Define the secondary sort order within each rank partition
              CASE rank
                WHEN 1 THEN login
                WHEN 2 THEN displayname
                WHEN 3 THEN login
                WHEN 4 THEN displayname
                ELSE login
              END ASC
          ) as rn -- rn is the row number within the rank group
        FROM RankedUsers
      )
      -- Final Selection: Get users where row number within rank is <= 5,
      -- then sort by overall rank and apply the final overall limit.
      SELECT
        login,
        displayname,
        image_url
      FROM NumberedUsers
      WHERE rn <= 5 -- Limit to top 5 within each rank
      ORDER BY
        rank ASC, -- Primary sort: by overall rank
        rn ASC    -- Secondary sort: by row number within rank (maintains secondary alpha sort)
      LIMIT $3;     -- Apply the overall maximum suggestion limit
    `;

    // Parameters for the query: $1 = startsWith, $2 = contains, $3 = overall limit
    const params = [`${searchTerm}%`, `%${searchTerm}%`, maxSuggestions];

    // Debug logs:
    // console.log(`Executing RowNumber Search SQL: ${sql.replace(/\s+/g, ' ').trim()}`);
    // console.log(`Params: ${JSON.stringify(params)}`);
    // Get a client from the pool, execute query, release client
    const client = await pool.connect();
    let rows;
    try {
      ({ rows } = await client.query(sql, params));
    } finally {
      client.release(); // IMPORTANT: Release client back to pool
    }
    const tierEndTime = performance.now();

    console.log(
      `RowNumber search query took ${(
        (tierEndTime - tierStartTime) /
        1000
      ).toFixed(3)}s, found ${rows?.length || 0} results for '${searchTerm}'`
    );

    // Map results to the expected frontend format
    const finalSuggestions = (rows || []).map((user) => ({
      login: user.login,
      displayname: user.displayname,
      image: { versions: { small: user.image_url || null } },
    }));

    return finalSuggestions;
  } catch (error) {
    console.error(
      `PostgreSQL error during row_number search for '${searchTerm}':`,
      error.message
    );
    return []; // Return empty array on error
  }
}

/**
 * Serverless API endpoint handler for searching users in the cache using tiered logic.
 * @async
 * @param {object} req - Vercel Request object
 * @param {object} req.query - Query parameters
 * @param {string} req.query.q - The search query term.
 * @param {object} res - Vercel Response object
 * @returns {object} HTTP response with an array of user suggestions or error message
 */
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*"); // TODO: Restrict in production
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

  // Check if Pool initialized correctly
  if (!pool) {
    console.error(
      "API Search Error: PostgreSQL Pool not initialized (DATABASE_URL missing?)."
    );
    return res.status(500).json({ error: "Server configuration error." });
  }
  // No need to connect pool explicitly here

  const { q } = req.query;

  // Validate query parameter
  if (!q || typeof q !== "string" || q.trim().length === 0) {
    return res
      .status(400)
      .json({ error: "Missing or empty query parameter 'q'." });
  }

  const searchTerm = q.trim().toLowerCase(); // Normalize search term
  const startTime = performance.now();

  try {
    // console.log(`Search initiated for: '${searchTerm}'`);

    // Call the refactored function with the pool
    const finalSuggestions = await sortSearchSuggestions(
      pool,
      searchTerm,
      MAX_SUGGESTIONS
    );

    const endTime = performance.now();
    console.log(
      `Found ${finalSuggestions.length} suggestions for '${searchTerm}' in ${(
        (endTime - startTime) /
        1000
      ).toFixed(3)}s`
    );
    return res.status(200).json(finalSuggestions);
  } catch (error) {
    // Catch unexpected errors during the overall process
    console.error(
      `Unexpected error during tiered search for '${searchTerm}':`,
      error
    );
    return res
      .status(500)
      .json({ error: "Internal server error during search." });
  }
};
