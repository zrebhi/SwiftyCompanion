FROM node:bullseye-slim

WORKDIR /swifty-api
COPY package.json yarn.lock* ./

RUN apt-get update && apt-get install -y bash procps

RUN yarn install