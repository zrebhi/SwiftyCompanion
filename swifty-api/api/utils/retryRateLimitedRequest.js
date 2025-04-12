/**
 * Simple retry function for rate limited requests
 * @param {Function} requestFn - Function that returns a promise for the request
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Promise} - Promise that resolves with the successful response
 */
export async function retryRateLimitedRequest(requestFn, maxRetries = 10) {
    let retries = 0;
    let delay = 1000; // Start with 1 second delay
  
    while (true) {
      try {
        return await requestFn();
      } catch (error) {
        // If not a rate limit error or we've exhausted retries, rethrow
        if (error.response?.status !== 429 || retries >= maxRetries) {
          throw error;
        }
  
        // Otherwise, wait and retry with exponential backoff
        retries++;
        console.log(
          `Rate limited, retrying in ${delay}ms (attempt ${retries}/${maxRetries})`
        );
  
        // Wait for the specified delay
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }