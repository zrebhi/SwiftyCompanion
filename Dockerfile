FROM node:20-bullseye-slim

# Set working directory
WORKDIR /swifty-companion

# Install system dependencies
RUN apt-get update && apt-get install -y bash

RUN npm install -g npm@latest

# Install Expo CLI globally
RUN npm install -g expo-cli@latest

# Install project dependencies for API authentication
RUN npm install axios react-native-app-auth expo-secure-store expo-router formik@2.4.5 yup@1.4.0

# RUN npm install --global @expo/ngrok@latest


RUN chmod 777 /swifty-companion