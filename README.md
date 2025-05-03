# SwiftyCompanion

Swifty Companion is a React Native mobile application that allows users to search for 42 students and view their profiles, including their skills, projects, and other details. The application uses the 42 API with OAuth2 authentication to retrieve student information.

## ✅ Project Completed

This project has been successfully completed and includes:

- User search functionality with debounced suggestions for efficient lookup.
- Detailed profile viewing including skills, projects, and stats.
- OAuth2 authentication with the 42 API.
- Custom API proxy (deployable on Vercel or runnable locally via Docker) to securely handle 42 API credentials.
- PostgreSQL database caching within the API proxy to reduce 42 API calls and improve performance for user lookups and search suggestions.
- Responsive design tested on iOS and Android.
- Dockerized local development environment using `run-app.sh`.
- Production-ready deployment pipeline using Vercel (for API) and EAS (for mobile app).

## Demo

<video src="https://github.com/user-attachments/assets/586b34ae-2b2f-4452-9589-239d600e72f4"></video>

## 📱 Running the App on Your Phone

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

<img src="https://qr.expo.dev/eas-update?slug=exp&projectId=6b82f6c9-afb7-467f-ade4-ede7ace16ecf&groupId=462b0b66-896f-426a-bf25-0e04f3e9a14d&host=u.expo.dev"></img>

</details>

## Running the App Locally

### Prerequisites

- **Docker & Docker Compose:** For running the application containers locally.
- **Node.js & npm/yarn:** For installing dependencies if needed (handled within Docker mostly).
- **Git:** For cloning the repository.
- **42 API Credentials:** `CLIENT_ID` and `CLIENT_SECRET`. Obtainable from the [42 API Getting Started Guide](https://api.intra.42.fr/apidoc/guides/getting_started) (requires 42 membership).
- **Remote PostgreSQL Database:** A connection URL (e.g., from Aiven, Neon, Supabase). The API proxy requires this for caching, even when run locally.
- **(Optional) Android SDK:** If you intend to run on an Android emulator managed outside Docker, set `ANDROID_SDK_PATH` in `.env`.

### Installation and Local Setup

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/zrebhi/SwiftyCompanion.git
    cd SwiftyCompanion
    ```
2.  **Create `.env` File:**
    Copy the example environment file:
    ```bash
    cp .env.example .env
    ```
3.  **Configure `.env`:**
    Fill in the required values in your `.env` file:

    - `CLIENT_ID`: Your 42 API client ID.
    - `CLIENT_SECRET`: Your 42 API client secret.
    - `DATABASE_URL`: The full connection URL for your **remote** PostgreSQL database.
    - `SSL_CERT`: The CA certificate content for your database (if required, e.g., for Aiven). See `.env.example` for formatting notes.
    - **API Configuration (Choose One):**
      - **Option A (Use Remote API):**
        - Set `PROJECT_LOCAL_API=false`.
        - Set `PROJECT_API_URL` to the URL of a deployed API proxy (e.g., the pre-deployed `https://swifty-api.vercel.app` or your own Vercel deployment).
      - **Option B (Run API Locally via Docker):**
        - Set `PROJECT_LOCAL_API=true`.
        - Set `IP_ADDRESS` to your machine's local IP address (accessible by your mobile device/emulator).
        - Set `PROJECT_LOCAL_API_PORT` (default is `3000`). The mobile app will connect to `http://<IP_ADDRESS>:<PROJECT_LOCAL_API_PORT>`.
        - `PROJECT_API_URL` is ignored when `PROJECT_LOCAL_API=true`.
    - `(Optional) ANDROID_SDK_PATH`: Set if using an external Android emulator.

4.  **Run the Application:**
    Execute the setup script. This script reads your `.env` file, builds/starts the necessary Docker containers (Expo app, and optionally the local API proxy), and launches the Expo development server.

    ```bash
    ./run-app.sh
    ```

    - Follow the Expo Go instructions in the terminal to open the app on your device or simulator/emulator.
    - If running the API locally (`PROJECT_LOCAL_API=true`), a separate terminal window will open running `vercel dev` for the API proxy.

5.  **(Optional) Populate Database Cache:**
    - The API caches data automatically. To pre-populate the cache (useful after initial setup), ensure your `.env` file has the correct `DATABASE_URL` and `SSL_CERT`, then run:
    ```bash
    node swifty-api/scripts/populate-cache.js
    ```

## Architecture

The project consists of two main Dockerized components orchestrated by `docker-compose.yml` and the `run-app.sh` script:

- **Mobile App (`swifty-companion`)**: A React Native/Expo application providing the user interface. It runs in the `app` Docker container.
- **API Proxy (`swifty-api`)**: A Node.js Vercel-compatible serverless function acting as a secure intermediary.
  - Handles OAuth2 authentication with the 42 API using your credentials (from `.env`).
  - Provides endpoints for searching users (`/api/users/search`) and fetching profiles (`/api/users/[login]`).
  - Connects to the **remote** PostgreSQL database (configured via `DATABASE_URL` and `SSL_CERT` in `.env`) for caching user data and search suggestions.
  - **Running Mode (determined by `PROJECT_LOCAL_API` in `.env`):**
    - If `false`: The `run-app.sh` script doesn't start the `api` container. The mobile app connects directly to the `PROJECT_API_URL` specified in `.env` (e.g., `https://swifty-api.vercel.app`).
    - If `true`: The `run-app.sh` script starts the `api` container and runs `vercel dev` inside it. The mobile app connects to this local API proxy at `http://<IP_ADDRESS>:<PROJECT_LOCAL_API_PORT>`. The local proxy still uses the remote database for caching.
