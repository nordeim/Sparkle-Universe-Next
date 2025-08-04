# 🚀 Deployment Guide: Prisma Schema on Dockerized PostgreSQL

This guide provides a comprehensive walkthrough for deploying the `LuxeVerse-Quantum` project's Prisma schema to a PostgreSQL 16 database running inside a Docker container.

**Target Environment:**
*   **Host OS:** Ubuntu 24.04.1 LTS
*   **Database:** `postgres:16-bookworm` Docker Image
*   **Orchestration:** Docker Compose
*   **Schema Management:** Prisma

---

## 📋 Table of Contents
1.  [Prerequisites](#-1-prerequisites)
2.  [Project Structure Setup](#-2-project-structure-setup)
3.  [Creating Configuration Files](#-3-creating-configuration-files)
    *   [3.1 `package.json`](#31-packagejson---defining-our-project-and-scripts)
    *   [3.2 `.env.local`](#32-envlocal---managing-environment-variables)
    *   [3.3 `.gitignore`](#33-gitignore---protecting-secrets)
    *   [3.4 `Dockerfile`](#34-dockerfile---creating-the-prisma-migration-environment)
    *   [3.5 `docker-compose.yml`](#35-docker-composeyml---orchestrating-our-services)
4.  [Deployment Steps](#-4-deployment-steps)
5.  [Verification](#-5-verification)
6.  [Next Steps & Best Practices](#-6-next-steps--best-practices)

---

### ✅ 1. Prerequisites

Before you begin, ensure your Ubuntu 24.04 desktop has the following tools installed.

#### 1.1 Docker and Docker Compose

We will install Docker from its official repository to ensure we have the latest version.

```bash
# 1. Update package lists and install dependencies
sudo apt-get update
sudo apt-get install -y ca-certificates curl

# 2. Add Docker's official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# 3. Set up the Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 4. Install Docker Engine and Compose
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 5. Add your user to the 'docker' group to run commands without sudo (requires logout/login)
sudo usermod -aG docker ${USER}
echo "✅ Docker installed. Please log out and log back in for group changes to take effect."
```

#### 1.2 Node.js (via NVM)

We recommend using Node Version Manager (NVM) to manage Node.js versions, as it avoids permission issues and provides flexibility.

```bash
# 1. Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# 2. Source your shell configuration to start using NVM
# (Close and re-open your terminal, or run one of the following)
# For bash:
source ~/.bashrc
# For zsh:
source ~/.zshrc

# 3. Install and use the latest LTS version of Node.js
nvm install --lts
nvm use --lts

# 4. Verify installation
node -v && npm -v
echo "✅ Node.js LTS installed via NVM."
```

### 📂 2. Project Structure Setup

First, let's create the necessary directories and files for our project.

```bash
# Create the root project directory
mkdir luxe-verse-deployment
cd luxe-verse-deployment

# Create the directory for your prisma schema
mkdir prisma

# Create the necessary configuration files
touch package.json .env.local .gitignore Dockerfile docker-compose.yml

# Copy your existing schema into the prisma directory
# (Assuming schema.prisma.txt is in your home directory)
cp ~/schema.prisma.txt prisma/schema.prisma
```

Your project should now have the following structure:
```
luxe-verse-deployment/
├── .env.local
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── package.json
└── prisma/
    └── schema.prisma
```

### ⚙️ 3. Creating Configuration Files

Now, let's populate each of the files we created with the correct configuration.

#### 3.1 `package.json` - Defining Our Project and Scripts

This file defines our project's Node.js dependencies and provides convenient scripts for interacting with Prisma.

```json
// package.json
{
  "name": "luxe-verse-db-deployment",
  "version": "1.0.0",
  "description": "Handles database deployment and migrations for the LuxeVerse-Quantum project.",
  "main": "index.js",
  "scripts": {
    "prisma:migrate": "prisma migrate dev --name init",
    "prisma:generate": "prisma generate",
    "db:deploy": "prisma migrate deploy",
    "db:studio": "prisma studio"
  },
  "keywords": [
    "prisma",
    "postgres",
    "docker"
  ],
  "author": "Your Name",
  "license": "ISC",
  "devDependencies": {
    "prisma": "^5.15.0"
  },
  "dependencies": {
    "@prisma/client": "^5.15.0"
  }
}
```

#### 3.2 `.env.local` - Managing Environment Variables

This file stores our database credentials and connection string. **Never commit this file to version control.**

```dotenv
# .env.local
# Environment variables for local development and deployment
# -----------------------------------------------------------

# PostgreSQL Credentials
# IMPORTANT: Change POSTGRES_PASSWORD to a strong, unique password.
POSTGRES_USER=postgres_user
POSTGRES_PASSWORD=YourSuperSecretPassword!
POSTGRES_DB=luxeversedb
POSTGRES_PORT=5432

# Prisma Database URL
# This URL is used by Prisma to connect to the PostgreSQL container.
# The host 'db' matches the service name in docker-compose.yml.
DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:${POSTGRES_PORT}/${POSTGRES_DB}?schema=public"
```

#### 3.3 `.gitignore` - Protecting Secrets

Create this file to ensure sensitive information and generated files are not committed to Git.

```gitignore
# .gitignore

# Node modules
node_modules

# Environment variables
.env
.env.local
.env.*.local

# Log files
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Prisma
.prisma/client
```

#### 3.4 `Dockerfile` - Creating the Prisma Migration Environment

This `Dockerfile` defines an image that contains Node.js and our Prisma dependencies. Its sole purpose is to run Prisma commands (like `migrate`) within the Docker network.

```dockerfile
# Dockerfile

# Use a lean, official Node.js image as our base
FROM node:20-bookworm-slim

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
```

#### 3.5 `docker-compose.yml` - Orchestrating Our Services

This is the central file that defines and configures our services: the PostgreSQL database (`db`) and a one-off task for running migrations (`migrate`).

```yaml
# docker-compose.yml
version: '3.8'

services:
  # --------------------
  # PostgreSQL Database Service
  # --------------------
  db:
    image: postgres:16-bookworm
    container_name: luxe-verse-postgres
    restart: always
    ports:
      # Exposes the database port to the host machine for tools like Prisma Studio
      - "${POSTGRES_PORT}:5432"
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      # Persists database data on the host machine to prevent data loss on container restart
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      # Checks if the database is ready to accept connections before other services start
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 5s
      timeout: 5s
      retries: 5

  # --------------------
  # Prisma Migration Service (One-off Task)
  # --------------------
  migrate:
    build:
      # Uses the Dockerfile in the current directory
      context: .
    env_file:
      # Loads the DATABASE_URL from our .env.local file
      - .env.local
    command: "npm run db:deploy"
    depends_on:
      db:
        # Ensures this service only starts after the 'db' service is healthy
        condition: service_healthy

volumes:
  # Defines the named volume for data persistence
  postgres_data:
```

### 🛠️ 4. Deployment Steps

With all the files in place, follow these steps to deploy your database.

#### Step 4.1: Install Node Dependencies
First, run `npm install` locally. This generates the `package-lock.json` file, which is crucial for creating a reproducible build inside our Docker container.

```bash
npm install
```

#### Step 4.2: Start the Database Service
Bring up the PostgreSQL database container. The `-d` flag runs it in detached mode (in the background).

```bash
docker-compose up -d db
```

You can check the status of your running container with `docker-compose ps`.

#### Step 4.3: Apply the Prisma Schema
Now, run the `migrate` service. Docker Compose will build the image from your `Dockerfile`, wait for the database to be healthy, and then execute `npm run db:deploy`, which in turn runs `prisma migrate deploy`.

```bash
docker-compose up migrate
```You will see output as Prisma connects to the database and applies the migrations. Since this is a one-off task, the container will exit after it succeeds.

### 🔍 5. Verification

Let's confirm that the schema was deployed correctly.

#### 5.1: Check the Logs
Inspect the logs from the `migrate` service to see the output from Prisma.

```bash
docker-compose logs migrate
```
You should see output indicating that the migrations were applied successfully.

#### 5.2: Connect Directly with `psql`
You can get a shell inside the PostgreSQL container and use `psql` to inspect the database directly.

```bash
# Execute psql inside the 'db' container
docker-compose exec db psql -U ${POSTGRES_USER} -d ${POSTGRES_DB}

# Once inside psql, list all tables
# You should see all the tables from your schema, including `_prisma_migrations`
\dt

# Inspect the 'users' table columns
\d "users"

# Exit psql
\q
```

#### 5.3: Use Prisma Studio (Recommended)
Prisma Studio provides a fantastic GUI to view and manage your data.

```bash
# Run the db:studio script from your package.json
npm run db:studio
```
This will open a new tab in your web browser at `http://localhost:5555`, where you can see all your models, columns, and relations visually.

### 📈 6. Next Steps & Best Practices

*   **Database Seeding**: Your next step is likely to populate the database with initial data. You can achieve this using [Prisma's seeding feature](https://www.prisma.io/docs/orm/prisma-migrate/workflows/seeding).
*   **Production vs. Development**: The `db:deploy` command (`prisma migrate deploy`) is intended for non-development environments. For local development, `prisma migrate dev` is preferred as it helps manage schema changes and can detect drift.
*   **Stopping the Environment**: To stop the database container, run:
    ```bash
    docker-compose down
    ```
*   **Cleaning Up**: To stop the container and remove the persistent data volume (deleting all database data), use the `-v` flag:
    ```bash
    docker-compose down -v
    ```
