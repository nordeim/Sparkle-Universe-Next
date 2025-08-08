#!/bin/bash
# execute_migrations.sh
# Master script to execute all migrations in correct order

set -e  # Exit on error

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5433}"
DB_USER="${DB_USER:-sparkle_user}"
DB_NAME="${DB_NAME:-sparkle_db}"

echo "Sparkle Universe Database Migration Execution"
echo "============================================"
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo ""

# Function to execute SQL file
execute_sql() {
    local file=$1
    local description=$2
    echo "Executing: $description"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$file"
    if [ $? -eq 0 ]; then
        echo "✓ Success: $description"
    else
        echo "✗ Failed: $description"
        exit 1
    fi
    echo ""
}

# Phase 1: Extensions
echo "Phase 1: Database Extensions"
echo "----------------------------"
execute_sql "prisma/migrations/001_enable_extensions.sql" "Enable extensions"

# Manual step required
echo "IMPORTANT: Manual configuration required!"
echo "1. Run as superuser:"
echo "   ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';"
echo "   ALTER SYSTEM SET pg_stat_statements.track = 'all';"
echo "   ALTER SYSTEM SET pg_stat_statements.max = 10000;"
echo "2. Restart PostgreSQL"
echo "3. Press Enter when complete..."
read -r

# Phase 2: JSON Indexes (No transaction)
echo "Phase 2: JSON GIN Indexes"
echo "-------------------------"
echo "Note: This will take time as indexes are created concurrently"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    -v ON_ERROR_STOP=1 -f "prisma/migrations/002_json_gin_indexes.sql"

# Phase 3: Functions
echo "Phase 3: Database Functions"
echo "---------------------------"
execute_sql "prisma/migrations/003_database_functions.sql" "Create functions"

# Phase 4: Materialized Views
echo "Phase 4: Materialized Views"
echo "---------------------------"
execute_sql "prisma/migrations/004_materialized_views.sql" "Create views"

# Phase 5: Triggers
echo "Phase 5: Database Triggers"
echo "--------------------------"
execute_sql "prisma/migrations/005_database_triggers.sql" "Create triggers"

# Phase 6: Full-text Search
echo "Phase 6: Full-text Search"
echo "-------------------------"
execute_sql "prisma/migrations/006_fulltext_search.sql" "Setup search"

# Phase 7: Partitioning (if needed)
# echo "Phase 7: Table Partitioning"
# echo "---------------------------"
# execute_sql "prisma/migrations/007_table_partitioning.sql" "Setup partitioning"

# Phase 8: Advanced Indexes
echo "Phase 8: Advanced Indexes"
echo "-------------------------"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    -v ON_ERROR_STOP=1 -f "prisma/migrations/008_advanced_indexes.sql"

# Phase 9: Monitoring
echo "Phase 9: Monitoring Setup"
echo "-------------------------"
execute_sql "prisma/migrations/009_monitoring_setup.sql" "Setup monitoring"

echo ""
echo "Migration Complete!"
echo "=================="
echo "Run verification: psql -d $DB_NAME -f verify_migration.sql"
