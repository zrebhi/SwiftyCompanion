# SwiftyCompanion

Swifty Companion is a React Native mobile application that allows users to search for 42 students and view their profiles, including their skills, projects, and other details. The application uses the 42 API with OAuth2 authentication to retrieve student information.

## ✅ Project Completed

This project has been successfully completed and includes:
- User search functionality to find 42 students
- Detailed profile viewing with skills, projects, and stats
- OAuth2 authentication with the 42 API
- Custom API proxy to securely handle credentials
- Responsive design that works on both iOS and Android
- Production-ready deployment with Vercel and EAS

## Setup

### Prerequisites

- Docker and Docker Compose installed on your machine

### Installation Steps

1. Clone the repository and navigate to the project directory.
2. Create a `.env` file in the project root based on `.env.exemple`:
   - Run the command: `cp .env.exemple .env`.
   

3. **Configure API access:**

* **Option A: Use pre-deployed API** (Recommended, no credentials needed)
  - In your `.env` file, set `PROJECT_LOCAL_API=false`
  - This uses our hosted API proxy at `https://swifty-api.vercel.app`

* **Option B: Run your own API** (Requires 42 API credentials)
  - In your `.env` file:
    - Set `PROJECT_LOCAL_API=true`
    - Set `IP_ADDRESS` to your local IP address
    - Add your `CLIENT_ID` and `CLIENT_SECRET` from the 42 API
    - 42 members can obtain these credentials from the [42 API Getting Started Guide](https://api.intra.42.fr/apidoc/guides/getting_started)

4. **Run the application:**
   - Execute the script `./run-app.sh` to start the application.


## Architecture

The project consists of two main components:
- **Mobile App**: React Native/Expo application for the frontend
- **API Proxy**: A Node.js serverless function that securely handles 42 API authentication
  - When `PROJECT_LOCAL_API=false`: Uses our pre-deployed proxy on Vercel
  - When `PROJECT_LOCAL_API=true`: Runs the proxy locally in a Docker container (requires your own 42 API credentials)