# postgres.Dockerfile
# /Home1/project/Sparkle-Universe-Next/postgres.Dockerfile

FROM postgres:16-bookworm

USER root

# Install postgresql-contrib-16 which contains uuid-ossp
RUN apt-get update && \
    apt-get install -y postgresql-contrib-16 && \
    rm -rf /var/lib/apt/lists/*

# Create initialization script to ensure extensions are created
RUN echo 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";' > /docker-entrypoint-initdb.d/10-extensions.sql

USER postgres
