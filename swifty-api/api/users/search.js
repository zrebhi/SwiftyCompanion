// swifty-api/api/users/search.js
const { createClient } = require("@supabase/supabase-js");
const { performance } = require("perf_hooks"); // For timing queries

// Initialize Supabase client
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("API Search Error: Missing Supabase environment variables.");
  // We should probably throw here or ensure supabase is not used if null
}
const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

const MAX_SUGGESTIONS = 10;
const TIER_FETCH_LIMIT = 20; // Fetch slightly more for contains tiers to allow filtering

/**
 * Performs a tiered search for user suggestions based on a search term.
 *
 * @async
 * @param {object} supabase - Initialized Supabase client instance.
 * @param {string} searchTerm - The term to search for.
 * @param {number} maxSuggestions - The maximum number of suggestions to return.
 * @param {number} tierFetchLimit - The limit for fetching results in 'contains' tiers.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of suggestion objects.
 */
async function sortSearchSuggestions(supabase, searchTerm, maxSuggestions, tierFetchLimit) {
  let finalSuggestions = [];
  const includedLogins = new Set(); // Use login (primary key) for deduplication

  // Helper to add unique suggestions and update included logins
  const addSuggestions = (newSuggestions) => {
    if (!newSuggestions || newSuggestions.length === 0) return;
    for (const user of newSuggestions) {
      if (finalSuggestions.length >= maxSuggestions) break;
      if (user && user.login != null && !includedLogins.has(user.login)) {
        finalSuggestions.push({
          login: user.login,
          displayname: user.displayname,
          image: { versions: { small: user.image_url || null } },
        });
        includedLogins.add(user.login);
      }
    }
  };

  // Helper to execute a tier query and handle errors/logging
  const executeTierQuery = async (queryBuilder, tierName) => {
    const tierStartTime = performance.now();
    const loginsToExclude = Array.from(includedLogins);
    if (loginsToExclude.length > 0) {
      const formattedLogins = `(${loginsToExclude
        .map((login) => `'${login.replace(/'/g, "''")}'`)
        .join(",")})`;
      queryBuilder = queryBuilder.not("login", "in", formattedLogins);
    }

    const { data, error } = await queryBuilder;
    const tierEndTime = performance.now();
    console.log(
      `Tier ${tierName} query took ${(
        (tierEndTime - tierStartTime) / 1000
      ).toFixed(3)}s, found ${data?.length || 0}`
    );

    if (error) {
      console.error(
        `Supabase error in Tier ${tierName} for query '${searchTerm}':`,
        error.message
      );
      return [];
    }
    return data || [];
  };

  // --- Tier 1: Login Starts With ---
  if (finalSuggestions.length < maxSuggestions) {
    const tier1Query = supabase
      .from("users_cache")
      .select("login, displayname, image_url")
      .ilike("login", `${searchTerm}%`)
      .order("login", { ascending: true })
      .limit(5);
    const tier1Results = await executeTierQuery(tier1Query, "1 (Login StartsWith)");
    addSuggestions(tier1Results);
  }

  // --- Tier 2: DisplayName Starts With ---
  if (finalSuggestions.length < maxSuggestions) {
    const tier2Query = supabase
      .from("users_cache")
      .select("login, displayname, image_url")
      .ilike("displayname", `${searchTerm}%`)
      .order("displayname", { ascending: true })
      .limit(5);
    const tier2Results = await executeTierQuery(tier2Query, "2 (DisplayName StartsWith)");
    addSuggestions(tier2Results);
  }

  // --- Tier 3: Login Contains ---
  if (finalSuggestions.length < maxSuggestions) {
    const tier3Query = supabase
      .from("users_cache")
      .select("login, displayname, image_url")
      .ilike("login", `%${searchTerm}%`)
      // Removed: .like("login", "[a-zA-Z]%")
      .order("login", { ascending: true })
      .limit(tierFetchLimit);
    const tier3Results = await executeTierQuery(tier3Query, "3 (Login Contains)"); // Updated tier name
    addSuggestions(tier3Results);
  }

  // --- Tier 4: DisplayName Contains ---
  if (finalSuggestions.length < maxSuggestions) {
    const tier4Query = supabase
      .from("users_cache")
      .select("login, displayname, image_url")
      .ilike("displayname", `%${searchTerm}%`)
      // Removed: .like("displayname", "[a-zA-Z]%")
      .order("displayname", { ascending: true })
      .limit(tierFetchLimit);
    const tier4Results = await executeTierQuery(tier4Query, "4 (DisplayName Contains)"); // Updated tier name
    addSuggestions(tier4Results);
  }

  // Removed Tier 3b and 4b

  return finalSuggestions;
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
  if (!q || typeof q !== "string" || q.trim().length === 0) {
    return res
      .status(400)
      .json({ error: "Missing or empty query parameter 'q'." });
  }

  const searchTerm = q.trim();
  const startTime = performance.now();

  try {
    console.log(`Tiered search initiated for: '${searchTerm}'`);

    // Call the extracted function to get suggestions
    const finalSuggestions = await sortSearchSuggestions(
      supabase,
      searchTerm,
      MAX_SUGGESTIONS,
      TIER_FETCH_LIMIT
    );

    const endTime = performance.now();
    console.log(
      `Found ${finalSuggestions.length} suggestions for '${searchTerm}' in ${(
        (endTime - startTime) / 1000
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
