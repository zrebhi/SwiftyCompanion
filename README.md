# SwiftyCompanion

Swifty Companion is a React Native mobile application that allows users to search for 42 students and view their profiles, including their skills, projects, and other details. The application uses the 42 API with OAuth2 authentication to retrieve student information.

## Setup

### Prerequisites

- Docker and Docker Compose installed on your machine

### Installation Steps

1. Clone the repository and navigate to the project directory.
2. Create a `.env` file in the project root based on `.env.exemple`:
   - Run the command: `cp .env.example .env`.
   - Add your `client_id` and `secret` from the 42 API.
   - 42 members can obtain these credentials by following the instructions on this page: [42 API Getting Started Guide](https://api.intra.42.fr/apidoc/guides/getting_started).
3. Run the server:
   - Execute the script `./run-app.sh` to start the application.
