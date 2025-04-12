import Constants from "expo-constants";

/**
 * Environment variables validation and access
 *
 * This class provides safe access to environment variables with validation
 * and fallback values. It ensures that critical configuration values are
 * properly validated before use to prevent runtime errors.
 */
class EnvironmentValidator {
  /**
   * Validates if a value is a valid port number (0-65535)
   *
   * @private
   * @param {any} port - The port value to validate
   * @returns {boolean} True if valid, false otherwise
   */
  private isValidPort(port: any): boolean {
    const num = parseInt(String(port), 10);
    return !isNaN(num) && num >= 0 && num <= 65535;
  }

  /**
   * Validates if a value is a valid IP address or "localhost"
   *
   * @private
   * @param {any} ip - The IP address to validate
   * @returns {boolean} True if valid, false otherwise
   */
  private isValidIpAddress(ip: any): boolean {
    if (typeof ip !== "string") return false;

    // Simple IP regex (matches IPv4)
    const ipRegex =
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ip === "localhost" || ipRegex.test(ip);
  }

  /**
   * Validates if a value is a valid URL
   *
   * @private
   * @param {any} url - The URL to validate
   * @returns {boolean} True if valid, false otherwise
   */
  private isValidUrl(url: any): boolean {
    if (typeof url !== "string") return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets a string environment variable with optional default value
   *
   * @private
   * @param {string} key - The environment variable key
   * @param {string} [defaultValue=''] - Default value if not found
   * @returns {string} The environment variable value or default
   */
  private getString(key: string, defaultValue: string = ""): string {
    const value = Constants.expoConfig?.extra?.[key];
    return typeof value === "string" ? value.trim() : defaultValue;
  }

  /* Public validated environment variables */
  readonly PROJECT_LOCAL_API: boolean;
  readonly PROJECT_LOCAL_API_PORT: string;
  readonly PROJECT_API_URL: string;
  readonly IP_ADDRESS: string;
  readonly API_BASE_URL: string;

  /**
   * Creates a new EnvironmentValidator instance
   *
   * Reads and validates all environment variables during initialization
   * and sets up derived values like API_BASE_URL.
   */
  constructor() {
    // Safe value retrieval with validation
    this.PROJECT_LOCAL_API =
      this.getString("PROJECT_LOCAL_API").toLowerCase() === "true";
    console.log(`PROJECT_LOCAL_API: ${this.PROJECT_LOCAL_API}`);

    const DEFAULT_PORT = "3000";
    this.PROJECT_LOCAL_API_PORT = this.isValidPort(
      this.getString("PROJECT_LOCAL_API_PORT")
    )
      ? this.getString("PROJECT_LOCAL_API_PORT")
      : DEFAULT_PORT;

    const DEFAULT_API_URL = "https://swifty-api.vercel.app";
    this.PROJECT_API_URL = this.isValidUrl(this.getString("PROJECT_API_URL"))
      ? this.getString("PROJECT_API_URL")
      : DEFAULT_API_URL;

    const DEFAULT_IP = "localhost";
    this.IP_ADDRESS = this.isValidIpAddress(this.getString("IP_ADDRESS"))
      ? this.getString("IP_ADDRESS")
      : DEFAULT_IP;

    // Build API_BASE_URL with validated inputs
    this.API_BASE_URL = this.PROJECT_LOCAL_API
      ? `http://${this.IP_ADDRESS || "localhost"}:${
          this.PROJECT_LOCAL_API_PORT
        }`
      : this.PROJECT_API_URL;
    console.log(`API_BASE_URL configured as: ${this.API_BASE_URL}`);
  }
}

const ENV = new EnvironmentValidator();

export default ENV;
