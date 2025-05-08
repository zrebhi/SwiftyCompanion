# SwiftyCompanion <img src="swifty-companion/assets/images/42_logo_white.svg" width="40" align="right">

[![React Native](https://img.shields.io/badge/react_native-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)](https://reactnative.dev)
[![Expo](https://img.shields.io/badge/expo-1C1E24?style=flat&logo=expo&logoColor=#D04A37)](https://docs.expo.dev)
[![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/docs/)

A React Native mobile app for searching 42 students and viewing detailed profiles via the 42 API.

## 📖 Table of Contents

- 🚀 [Features](#-features)
- 🎥 [Demo](#-demo)
- 📱 [Run the App on Your Phone!](#-run-the-app-on-your-phone)
- 📦 [Installation](#-installation-and-local-setup)
- 🏗 [Architecture](#-architecture)
- 🛠 [Development](#-development)

## 🚀 Features

✔️ **Completed Project** with full functionality:

- 🔍 User search with debounced suggestions
- 📊 Detailed profile viewing (skills, projects, stats)
- 🔒 OAuth2 authentication with 42 API
- 🚀 Production-ready deployment (Vercel + EAS)
- 🐳 Dockerized development environment
- 💾 PostgreSQL caching to reduce 42 API calls and improve performance

## 🎥 Demo

https://github.com/user-attachments/assets/586b34ae-2b2f-4452-9589-239d600e72f4

## 📱 Run the App on Your Phone!

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

<img src="https://qr.expo.dev/eas-update?slug=exp&projectId=6b82f6c9-afb7-467f-ade4-ede7ace16ecf&groupId=5f856d07-1137-4402-a95a-cfe2431d4ad7&host=u.expo.dev"></img>

</details>

## 📦 Installation and Local Setup

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/zrebhi/SwiftyCompanion.git
   cd SwiftyCompanion
   ```

2. **Create .env File**:

   ```bash
   cp .env.example .env
   ```

3. **Configure .env**:

   ```bash
   # Database configuration (always required)
   DATABASE_URL=postgres://user:pass@host:port/db

   # API Configuration (Choose One):
   # Option A - Use Remote API (no credentials needed):
   PROJECT_LOCAL_API=false
   PROJECT_API_URL=https://swifty-api.vercel.app

   # Option B - Run API Locally (requires 42 credentials):
   PROJECT_LOCAL_API=true
   CLIENT_ID=your_42_client_id
   CLIENT_SECRET=your_42_client_secret
   IP_ADDRESS=your_local_ip
   PROJECT_LOCAL_API_PORT=3000
   ```

   | Variable                 | Required When           | Description                |
   | ------------------------ | ----------------------- | -------------------------- |
   | `DATABASE_URL`           | Always                  | PostgreSQL connection URL  |
   | `PROJECT_LOCAL_API`      | Always                  | `true`/`false` toggle      |
   | `CLIENT_ID`              | PROJECT_LOCAL_API=true  | 42 API client ID           |
   | `CLIENT_SECRET`          | PROJECT_LOCAL_API=true  | 42 API client secret       |
   | `PROJECT_API_URL`        | PROJECT_LOCAL_API=false | Remote API URL             |
   | `IP_ADDRESS`             | PROJECT_LOCAL_API=true  | Local IP for mobile access |
   | `PROJECT_LOCAL_API_PORT` | PROJECT_LOCAL_API=true  | Local API port             |

4. **Run the Application**:

   ```bash
   ./run-app.sh
   ```

5. **(Optional) Populate Cache**:
   ```bash
   node swifty-api/scripts/populate-cache.js
   ```

## 🏗 Architecture

```mermaid
graph TD
    A[Mobile App] -->|API Calls| B{API Proxy}
    B -->|OAuth2| C[42 API]
    B -->|Cache| D[(PostgreSQL)]

    subgraph Docker
        A --> E[Expo Dev Server]
        B --> F[Vercel Dev]
    end
```

## 🛠 Development

**Project Structure**:

```
SwiftyCompanion/
├── swifty-api/         # API proxy
├── swifty-companion/   # React Native app
├── docker-compose.yml  # Docker config
└── run-app.sh          # Dev script
```
