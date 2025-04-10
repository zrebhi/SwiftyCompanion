FROM node:bullseye-slim

WORKDIR /swifty-companion

RUN apt-get update && apt-get install -y bash git

# Install global tools except for expo-cli which is now deprecated
RUN npm install -g npm@latest vercel@latest eas-cli@latest

RUN yarn add expo

# Install common React Native dependencies
RUN npm install axios react-native-app-auth react-native-safe-area-context expo-secure-store expo-router formik yup

RUN chmod 777 /swifty-companion