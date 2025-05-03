FROM node:bullseye-slim

WORKDIR /swifty-companion

# Install only strictly necessary packages (removed git)
RUN apt-get update && \
    apt-get install -y --no-install-recommends bash git && \
    # Clean up apt cache
    rm -rf /var/lib/apt/lists/*

COPY package.json yarn.lock* ./

# Install Node.js dependencies
RUN yarn install --non-interactive

# Fix permissions (Note: chmod 777 is generally not recommended, consider USER node if possible later)
RUN chmod 777 /swifty-companion