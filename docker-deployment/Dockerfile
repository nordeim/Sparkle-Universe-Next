# Dockerfile

# Use a lean, official Node.js image as our base
FROM node:22-bookworm-slim

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to leverage Docker's layer caching.
# This step only re-runs if these files change.
COPY package*.json ./

# Install project dependencies, including Prisma CLI
RUN npm install

# Copy the Prisma schema and the rest of the project files
COPY . .

# This image is now ready. The 'CMD' will be provided by docker-compose.
