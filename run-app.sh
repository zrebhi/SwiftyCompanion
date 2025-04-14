#!/bin/bash
# filepath: /home/zak/Projects/SwiftyCompanion/run-app.sh

# Load environment variables
set -a
source .env
set +a

# Define colors for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}Loading configuration from .env file...${NC}"

# Stop any running containers
echo -e "${YELLOW}Stopping any running containers...${NC}"
docker compose down

# Build and start app container
echo -e "${YELLOW}Building and starting app container...${NC}"
docker compose up -d --build app

# Function to detect the terminal emulator
launch_terminal() {
  local title="$1"
  local command="$2"
  
  # Try gnome-terminal (GNOME)
  if command -v gnome-terminal >/dev/null; then
    gnome-terminal --title="$title" -- bash -c "$command; exec bash" &
    return 0
  fi
  
  # Try konsole (KDE)
  if command -v konsole >/dev/null; then
    konsole --new-tab --title "$title" -e bash -c "$command; exec bash" &
    return 0
  fi
  
  # Try xterm (fallback for X11)
  if command -v xterm >/dev/null; then
    xterm -T "$title" -e bash -c "$command; exec bash" &
    return 0
  fi
  
  echo -e "${RED}No compatible terminal emulator found!${NC}"
  return 1
}


# Convert to lowercase for comparison
PROJECT_LOCAL_API=$(echo "$PROJECT_LOCAL_API" | tr '[:upper:]' '[:lower:]')
# Conditionally start API container
if [ "$PROJECT_LOCAL_API" = "true" ]; then
  # Set default port if not specified
  PROJECT_LOCAL_API_PORT=${PROJECT_LOCAL_API_PORT:-3000}
  echo -e "${YELLOW}Starting local API service on port ${GREEN}$PROJECT_LOCAL_API_PORT${NC}${NC}"
  docker compose up -d --build api
  
  # Launch terminal for API
  if launch_terminal "Swifty API - Vercel" "docker compose exec -it api bash -c 'npm install axios && vercel dev --listen ${PROJECT_LOCAL_API_PORT}'"; then
    echo -e "${GREEN}Launched Vercel API terminal!${NC}"
  else
    echo -e "${RED}Failed to launch API terminal!${NC}"
  fi
else
  echo -e "${BLUE}Using remote API at ${YELLOW}$PROJECT_API_URL${BLUE}. API container not started.${NC}"
fi

# Launch terminal for app (always)
echo -e "${GREEN}Launching Expo development server...${NC}"
docker compose exec -it app bash -c 'cd /swifty-companion && yarn add expo && npx expo start --offline';
echo -e "${YELLOW}Expo server exited.${NC}"

# Prompt user to stop all containers
echo -e "${BLUE}Containers are still running. Do you want to stop them? (y/n)${NC}"
read -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}Stopping all containers...${NC}"
  docker compose down
  echo -e "${GREEN}All containers stopped successfully.${NC}"
else
  echo -e "${BLUE}Containers are still running. You can stop them later with 'docker compose down'.${NC}"
fi

echo -e "${GREEN}Thank you for using Swifty Companion!${NC}"