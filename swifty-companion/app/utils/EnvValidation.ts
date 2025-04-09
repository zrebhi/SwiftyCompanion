import Constants from 'expo-constants';

/**
 * Environment variables validation and access
 */
class EnvironmentValidator {
  private isValidPort(port: any): boolean {
    const num = parseInt(String(port), 10);
    return !isNaN(num) && num >= 0 && num <= 65535;
  }

  private isValidIpAddress(ip: any): boolean {
    if (typeof ip !== 'string') return false;
    
    // Simple IP regex (matches IPv4)
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ip === 'localhost' || ipRegex.test(ip);
  }

  private isValidUrl(url: any): boolean {
    if (typeof url !== 'string') return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private getString(key: string, defaultValue: string = ''): string {
    const value = Constants.expoConfig?.extra?.[key];
    return typeof value === 'string' ? value.trim() : defaultValue;
  }

  // Public validated environment variables
  readonly PROJECT_LOCAL_API: boolean;
  readonly PROJECT_LOCAL_API_PORT: string;
  readonly PROJECT_API_URL: string;
  readonly IP_ADDRESS: string;
  readonly API_BASE_URL: string;

  constructor() {
    // Safe value retrieval with validation
    this.PROJECT_LOCAL_API = this.getString('PROJECT_LOCAL_API').toLowerCase() === 'true';
    
    const DEFAULT_PORT = "3000";
    this.PROJECT_LOCAL_API_PORT = this.isValidPort(this.getString('PROJECT_LOCAL_API_PORT'))
      ? this.getString('PROJECT_LOCAL_API_PORT')
      : DEFAULT_PORT;
    
    const DEFAULT_API_URL = "https://swifty-api.vercel.app";
    this.PROJECT_API_URL = this.isValidUrl(this.getString('PROJECT_API_URL'))
      ? this.getString('PROJECT_API_URL')
      : DEFAULT_API_URL;
    
    const DEFAULT_IP = "localhost";
    this.IP_ADDRESS = this.isValidIpAddress(this.getString('IP_ADDRESS'))
      ? this.getString('IP_ADDRESS')
      : DEFAULT_IP;
    
    // Build API_BASE_URL with validated inputs
    this.API_BASE_URL = this.PROJECT_LOCAL_API
      ? `http://${this.IP_ADDRESS}:${this.PROJECT_LOCAL_API_PORT}`
      : this.PROJECT_API_URL;
  }
}

const ENV = new EnvironmentValidator();

export default ENV;