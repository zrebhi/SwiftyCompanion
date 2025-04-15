FROM node:bullseye-slim

WORKDIR /swifty-api
COPY package.json yarn.lock* ./

RUN apt-get update && apt-get install -y bash


RUN npm install --force -g yarn@latest npm@latest

RUN yarn install --non-interactive

RUN chmod 777 /swifty-api