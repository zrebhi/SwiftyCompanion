#!/bin/bash

set -e  # Exit on error

# Colors for terminal output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}==== Swifty Companion Development Environment ====${NC}"

echo -e "${YELLOW}Stopping any running containers...${NC}"
docker-compose down || { echo -e "${RED}Failed to stop containers${NC}"; exit 1; }

echo -e "${YELLOW}Building and starting containers...${NC}"
docker-compose up -d --build || { echo -e "${RED}Failed to build and start containers${NC}"; exit 1; }

echo -e "${GREEN}Container is running!${NC}"
echo -e "${BLUE}Starting Expo...${NC}"
echo -e "${YELLOW}(This might take a moment to start)${NC}"

# Execute the Expo command in the container
docker exec -it swifty-companion bash -c "npx expo start"

# Handle exit gracefully
echo -e "${BLUE}Expo server stopped.${NC}"
echo -e "${YELLOW}Container is still running in the background.${NC}"
echo -e "${YELLOW}To stop it, run: docker-compose down${NC}"