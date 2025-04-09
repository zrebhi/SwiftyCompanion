FROM node:bullseye-slim

WORKDIR /swifty-companion

RUN apt-get update && apt-get install -y bash git

RUN npm install -g npm@latest expo-cli@latest vercel@latest eas-cli@latest

RUN npm install axios react-native-app-auth react-native-safe-area-context expo-secure-store expo-router formik yup

RUN chmod 777 /swifty-companion