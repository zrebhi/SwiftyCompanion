FROM node:bullseye-slim

WORKDIR /swifty-companion

# Install dependencies
RUN apt-get update && apt-get install -y bash git

# Install global tools
RUN npm install -g npm@latest vercel@latest eas-cli@latest

# Fix permissions
RUN chmod 777 /swifty-companion