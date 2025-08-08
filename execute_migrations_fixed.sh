#!/bin/bash
# execute_migrations_fixed.sh
# Fixed execution script with proper error handling

set -e

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5433}"
DB_USER="${DB_USER:-sparkle_user}"
DB_NAME="${DB_NAME:-sparkle_db}"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "Sparkle Universe Database Migration v2"
echo "======================================"
echo "Database: $DB_NAME"
echo ""

# Function to execute SQL with error handling
execute_sql() {
    local file=$1
    local description=$2
    echo -e "${YELLOW}Executing: $description${NC}"
    
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
           -v ON_ERROR_STOP=1 -f "$file" 2>&1 | tee /tmp/migration_log.txt; then
        echo -e "${GREEN}✓ Success: $description${NC}\n"
        return 0
    else
        echo -e "${RED}✗ Failed: $description${NC}"
        echo "Error details in /tmp/migration_log.txt"
        return 1
    fi
}

# Function to execute single SQL command
execute_sql_command() {
    local command=$1
    local description=$2
    echo -e "${YELLOW}Executing: $description${NC}"
    
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
           -c "$command" 2>&1 | tee -a /tmp/migration_log.txt; then
        echo -e "${GREEN}✓ Success${NC}"
        return 0
    else
        echo -e "${RED}✗ Failed${NC}"
        return 1
    fi
}

# Phase 1: Extensions
echo "Phase 1: Database Extensions"
execute_sql "001_enable_extensions.sql" "Enable extensions"

# Phase 2: JSON Indexes (non-transactional)
echo -e "\nPhase 2: JSON GIN Indexes (This will take time...)"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
     -f "002_json_gin_indexes.sql" 2>&1 | tee -a /tmp/migration_log.txt

# Phase 3: Functions (with fixed data types)
echo -e "\nPhase 3: Database Functions"
execute_sql "003_database_functions.sql" "Create functions"

# Phase 4: Materialized Views
echo -e "\nPhase 4: Materialized Views"
execute_sql "004_materialized_views.sql" "Create materialized views"

# Phase 5: Triggers
echo -e "\nPhase 5: Database Triggers"
execute_sql "005_database_triggers.sql" "Create triggers"

# Phase 6: Full-text Search (split execution)
echo -e "\nPhase 6: Full-text Search"
echo "Part 1: Table modifications and functions"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
     -c "\\i 006_fulltext_search_part1.sql"

echo "Part 2: Creating search indexes (non-transactional)"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
     -f "006_fulltext_search_part2.sql"

# Phase 7: Advanced Indexes (non-transactional)
echo -e "\nPhase 7: Advanced Indexes"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
     -f "008_advanced_indexes.sql"

# Phase 8: Verification
echo -e "\n${YELLOW}Running verification...${NC}"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
     -f "verify_migration.sql"

echo -e "\n${GREEN}Migration Complete!${NC}"
echo "Check /tmp/migration_log.txt for detailed logs"
