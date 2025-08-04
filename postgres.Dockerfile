# postgres.Dockerfile

# Start from the official PostgreSQL 16 image
FROM postgres:16-bookworm

# Switch to the root user to install packages
USER root

# Update the package list and install the postgresql-contrib package
# This package contains uuid-ossp and other useful extensions
RUN apt-get update && apt-get install -y postgresql-contrib

# Switch back to the default postgres user for security
USER sparkle_user
