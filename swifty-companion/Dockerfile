FROM node:bullseye-slim

WORKDIR /swifty-companion

# Install dependencies
RUN apt-get update && apt-get install -y bash git

COPY package.json yarn.lock* ./

RUN npm install --force -g yarn@latest npm@latest

RUN yarn install --non-interactive

# Fix permissions
RUN chmod 777 /swifty-companion