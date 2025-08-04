# postgres.Dockerfile
# /Home1/project/Sparkle-Universe-Next/postgres.Dockerfile

# Start from the official PostgreSQL 16 image
FROM postgres:16-bookworm

# Switch to the root user to install packages
USER root

# Update the package list and install the specific PostgreSQL 16 contrib package
# Also install uuid-dev which provides the OSSP UUID library
RUN apt-get update && \
    apt-get install -y \
        postgresql-contrib-16 \
        uuid-dev \
        postgresql-server-dev-16 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Debug: List available extensions
RUN echo "Available PostgreSQL 16 extensions:" && \
    ls -la /usr/share/postgresql/16/extension/ | grep -E "(uuid|ossp)" || echo "No uuid extensions found in standard location"

# Create a custom initialization script to enable uuid-ossp extension
# This script will run automatically when the database is first created
RUN echo '#!/bin/bash' > /docker-entrypoint-initdb.d/10-uuid-ossp.sh && \
    echo 'set -e' >> /docker-entrypoint-initdb.d/10-uuid-ossp.sh && \
    echo 'psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL' >> /docker-entrypoint-initdb.d/10-uuid-ossp.sh && \
    echo '    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";' >> /docker-entrypoint-initdb.d/10-uuid-ossp.sh && \
    echo '    SELECT * FROM pg_extension WHERE extname = '\''uuid-ossp'\'';' >> /docker-entrypoint-initdb.d/10-uuid-ossp.sh && \
    echo 'EOSQL' >> /docker-entrypoint-initdb.d/10-uuid-ossp.sh && \
    chmod +x /docker-entrypoint-initdb.d/10-uuid-ossp.sh

# Switch back to the default postgres user for security
USER postgres
