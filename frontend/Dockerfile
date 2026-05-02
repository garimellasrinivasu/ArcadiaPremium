# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Apache Server
FROM httpd:2.4-alpine

# Copy the build output to Apache's default public folder
COPY --from=build /app/dist /usr/local/apache2/htdocs/

# Copy your custom Apache configuration
COPY my-apache.conf /usr/local/apache2/conf/httpd.conf

EXPOSE 80