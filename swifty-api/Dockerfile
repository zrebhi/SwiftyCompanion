FROM node:bullseye-slim

WORKDIR /swifty-api

RUN apt-get update && apt-get install -y bash

RUN npm install -g npm@latest vercel@latest

RUN npm install axios

RUN chmod 777 /swifty-api