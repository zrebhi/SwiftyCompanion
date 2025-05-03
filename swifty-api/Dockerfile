FROM node:bullseye-slim

WORKDIR /swifty-api
COPY package.json yarn.lock* ./

# Install only strictly necessary packages
RUN apt-get update && \
    apt-get install -y --no-install-recommends bash && \
    # Clean up apt cache
    rm -rf /var/lib/apt/lists/*

# Install Node.js dependencies
RUN yarn install