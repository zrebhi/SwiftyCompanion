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

## Running the App on Your Phone

You can run SwiftyCompanion directly on your device using the Expo Go app:

### For Android Users:
1. Install [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent) from the Google Play Store
2. Open the Expo Go app
3. Tap on "Scan QR Code" in the app and scan the QR code below

### For iOS Users:
1. Install [Expo Go](https://apps.apple.com/app/expo-go/id982107779) from the App Store
2. Open your phone's camera app and scan the QR code below
3. Select "Open with Expo Go" when prompted

<details>
<summary>📱 Click to show QR code</summary>

![SwiftyCompanion QR Code](https://qr.expo.dev/eas-update?slug=exp&projectId=6b82f6c9-afb7-467f-ade4-ede7ace16ecf&groupId=d6b9493a-e9b2-4fce-bfa7-7831baaf0f05&host=u.expo.dev)

</details>

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