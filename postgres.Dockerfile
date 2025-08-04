# postgres.Dockerfile
# /Home1/project/Sparkle-Universe-Next/postgres.Dockerfile

# Start from the official PostgreSQL 16 image
FROM postgres:16-bookworm

# Switch to the root user to install packages
USER root

# Update the package list and install the required extensions
# Install postgresql-contrib which includes uuid-ossp and other useful extensions
# Also install postgresql-16 to ensure all base extensions are available
RUN apt-get update && \
    apt-get install -y postgresql-contrib postgresql-16 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create a custom initialization script to enable uuid-ossp extension
RUN echo "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";" > /docker-entrypoint-initdb.d/10-uuid-ossp.sql

# Switch back to the default postgres user for security
USER postgres
