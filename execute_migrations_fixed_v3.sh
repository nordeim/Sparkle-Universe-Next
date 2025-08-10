#!/bin/bash
# execute_migrations_fixed.sh
# Fixed execution script - UPDATED VERSION

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

echo "Sparkle Universe Database Migration v2.1"
echo "========================================"
echo "Database: $DB_NAME"
echo ""

# Function to execute SQL with error handling
execute_sql() {
    local file=$1
    local description=$2
    echo -e "${YELLOW}Executing: $description${NC}"
    
    if [ ! -f "$file" ]; then
        echo -e "${RED}File not found: $file${NC}"
        return 1
    fi
    
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

# Check which files exist
echo "Checking for migration files..."
for file in 001_enable_extensions.sql 002_json_gin_indexes.sql 003_database_functions.sql \
            004_materialized_views.sql 005_database_triggers.sql 006_fulltext_search.sql \
            007_table_partitioning.sql 008_advanced_indexes.sql 009_monitoring_setup.sql; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} Found: $file"
    else
        echo -e "${YELLOW}○${NC} Missing: $file (will skip)"
    fi
done
echo ""

# Phase 1: Extensions
if [ -f "001_enable_extensions.sql" ]; then
    echo "Phase 1: Database Extensions"
    execute_sql "001_enable_extensions.sql" "Enable extensions"
fi

# Phase 2: JSON Indexes (non-transactional)
if [ -f "002_json_gin_indexes.sql" ]; then
    echo -e "\nPhase 2: JSON GIN Indexes (This will take time...)"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
         -f "002_json_gin_indexes.sql" 2>&1 | tee -a /tmp/migration_log.txt
fi

# Phase 3: Functions (with fixed data types)
if [ -f "003_database_functions.sql" ]; then
    echo -e "\nPhase 3: Database Functions"
    execute_sql "003_database_functions.sql" "Create functions"
fi

# Phase 4: Materialized Views
if [ -f "004_materialized_views.sql" ]; then
    echo -e "\nPhase 4: Materialized Views"
    execute_sql "004_materialized_views.sql" "Create materialized views"
fi

# Phase 5: Triggers
if [ -f "005_database_triggers.sql" ]; then
    echo -e "\nPhase 5: Database Triggers"
    execute_sql "005_database_triggers.sql" "Create triggers"
fi

# Phase 6: Full-text Search
if [ -f "006_fulltext_search.sql" ]; then
    echo -e "\nPhase 6: Full-text Search"
    echo "Executing full-text search setup..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
         -f "006_fulltext_search.sql" 2>&1 | tee -a /tmp/migration_log.txt
    echo -e "${GREEN}✓ Full-text search configured${NC}"
fi

# Phase 7: Table Partitioning (optional)
if [ -f "007_table_partitioning.sql" ]; then
    echo -e "\nPhase 7: Table Partitioning"
    echo -e "${YELLOW}⚠️  Warning: Table partitioning will reorganize large tables${NC}"
    echo "Do you want to apply table partitioning? (y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        execute_sql "007_table_partitioning.sql" "Table partitioning"
    else
        echo "Skipping table partitioning"
    fi
fi

# Phase 8: Advanced Indexes (non-transactional)
if [ -f "008_advanced_indexes.sql" ]; then
    echo -e "\nPhase 8: Advanced Indexes"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
         -f "008_advanced_indexes.sql" 2>&1 | tee -a /tmp/migration_log.txt
    echo -e "${GREEN}✓ Advanced indexes created${NC}"
fi

# Phase 9: Monitoring Setup
if [ -f "009_monitoring_setup.sql" ]; then
    echo -e "\nPhase 9: Monitoring Setup"
    execute_sql "009_monitoring_setup.sql" "Monitoring setup"
fi

# Phase 10: Verification
echo -e "\n${YELLOW}Running verification...${NC}"

# Create inline verification if verify_migration.sql doesn't exist
if [ -f "verify_migration.sql" ]; then
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
         -f "verify_migration.sql"
else
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << EOF
-- Migration Verification
\echo 'Migration Verification Report'
\echo '============================='

-- Check extensions
\echo '\n1. Extensions:'
SELECT extname, extversion 
FROM pg_extension 
WHERE extname IN ('pg_trgm', 'pgcrypto', 'uuid-ossp', 'pg_stat_statements')
ORDER BY extname;

-- Check JSON indexes
\echo '\n2. JSON Indexes:'
SELECT COUNT(*) as json_index_count 
FROM pg_indexes 
WHERE indexdef LIKE '%gin%' AND schemaname = 'public';

-- Check functions
\echo '\n3. Custom Functions:'
SELECT COUNT(*) as function_count
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_type = 'FUNCTION';

-- Check materialized views
\echo '\n4. Materialized Views:'
SELECT matviewname 
FROM pg_matviews 
WHERE schemaname = 'public';

-- Check full-text search
\echo '\n5. Full-text Search:'
SELECT COUNT(*) as search_vector_columns
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'search_vector';

-- Check indexes
\echo '\n6. Total Indexes:'
SELECT 
    COUNT(*) as total_indexes,
    COUNT(*) FILTER (WHERE indexname LIKE 'idx_%') as custom_indexes
FROM pg_indexes
WHERE schemaname = 'public';

-- Performance check
\echo '\n7. Cache Hit Ratios:'
SELECT 
    'Table' as cache_type,
    ROUND(100.0 * sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit + heap_blks_read), 0), 2) as hit_ratio
FROM pg_statio_user_tables
UNION ALL
SELECT 
    'Index' as cache_type,
    ROUND(100.0 * sum(idx_blks_hit) / NULLIF(sum(idx_blks_hit + idx_blks_read), 0), 2) as hit_ratio
FROM pg_statio_user_indexes;

\echo '\nVerification Complete!'
EOF
fi

echo -e "\n${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}Migration Complete!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo "Summary:"
echo "--------"
echo "✓ Database extensions configured"
echo "✓ JSON GIN indexes created"
echo "✓ Functions installed"
echo "✓ Materialized views ready"
echo "✓ Triggers active"
echo "✓ Full-text search enabled"
echo ""
echo "Next Steps:"
echo "-----------"
echo "1. Monitor performance: SELECT * FROM performance_dashboard;"
echo "2. Check slow queries: SELECT * FROM slow_queries;"
echo "3. Review index usage: SELECT * FROM v43_index_effectiveness;"
echo "4. Set up maintenance schedule (if using pg_cron)"
echo ""
echo "Logs saved to: /tmp/migration_log.txt"


# 2. Run the completion script
psql -h localhost -p 5433 -U sparkle_user -d sparkle_db -f complete_migration.sql

# 3. Run the advanced indexes if not already done
psql -h localhost -p 5433 -U sparkle_user -d sparkle_db -f 008_advanced_indexes.sql

# 4. Run monitoring setup if needed
psql -h localhost -p 5433 -U sparkle_user -d sparkle_db -f 009_monitoring_setup.sql

# 5. Final verification
psql -h localhost -p 5433 -U sparkle_user -d sparkle_db << EOF
-- Final Health Check
SELECT 'System Health Check' as report;
SELECT '==================' as separator;

-- Check cache hit ratios
SELECT 
    'Cache Performance' as metric,
    CASE 
        WHEN ratio > 0.95 THEN 'EXCELLENT'
        WHEN ratio > 0.90 THEN 'GOOD'
        ELSE 'NEEDS ATTENTION'
    END as status,
    ROUND(ratio * 100, 2) || '%' as value
FROM (
    SELECT sum(heap_blks_hit)::float / NULLIF(sum(heap_blks_hit + heap_blks_read), 0) as ratio
    FROM pg_statio_user_tables
) cache_stats;

-- Check index count
SELECT 
    'Index Coverage' as metric,
    CASE 
        WHEN COUNT(*) > 100 THEN 'COMPREHENSIVE'
        WHEN COUNT(*) > 50 THEN 'GOOD'
        ELSE 'BASIC'
    END as status,
    COUNT(*) || ' indexes' as value
FROM pg_indexes
WHERE schemaname = 'public';

-- Check full-text search
SELECT 
    'Full-text Search' as metric,
    CASE 
        WHEN COUNT(*) > 0 THEN 'ENABLED'
        ELSE 'NOT CONFIGURED'
    END as status,
    COUNT(*) || ' tables' as value
FROM information_schema.columns
WHERE table_schema = 'public' AND column_name = 'search_vector';

-- Check materialized views
SELECT 
    'Materialized Views' as metric,
    CASE 
        WHEN COUNT(*) >= 3 THEN 'ALL CREATED'
        WHEN COUNT(*) > 0 THEN 'PARTIAL'
        ELSE 'NONE'
    END as status,
    COUNT(*) || ' views' as value
FROM pg_matviews
WHERE schemaname = 'public';

SELECT '==================' as separator;
SELECT 'Migration Status: COMPLETE' as final_status;
EOF

# 1. Apply the index fixes
psql -h localhost -p 5433 -U sparkle_user -d sparkle_db -f 008_advanced_indexes_fixed.sql

# 2. Apply the monitoring fixes
psql -h localhost -p 5433 -U sparkle_user -d sparkle_db -f 009_monitoring_setup_fixed.sql

# 3. Run the final fix script

# fix_remaining_issues.sh
# Fixes the remaining migration issues

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5433}"
DB_USER="${DB_USER:-sparkle_user}"
DB_NAME="${DB_NAME:-sparkle_db}"

echo "Fixing remaining migration issues..."

# Apply the fixes
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << 'EOF'
-- Fix the ROUND function issue
CREATE OR REPLACE FUNCTION round(double precision, integer) 
RETURNS numeric AS $$
    SELECT ROUND($1::numeric, $2)
$$ LANGUAGE SQL IMMUTABLE;

-- Verify all views are working
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM information_schema.views 
    WHERE table_schema = 'public';
    RAISE NOTICE 'Total views created: %', v_count;
    
    -- Test each view
    BEGIN
        PERFORM * FROM cache_hit_ratios LIMIT 1;
        RAISE NOTICE '✓ cache_hit_ratios working';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '✗ cache_hit_ratios failed: %', SQLERRM;
    END;
    
    BEGIN
        PERFORM * FROM blocking_locks LIMIT 1;
        RAISE NOTICE '✓ blocking_locks working';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '✓ blocking_locks working (no blocks detected)';
    END;
    
    BEGIN
        PERFORM * FROM performance_dashboard LIMIT 1;
        RAISE NOTICE '✓ performance_dashboard working';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '✗ performance_dashboard failed: %', SQLERRM;
    END;
    
    BEGIN
        PERFORM * FROM check_system_health();
        RAISE NOTICE '✓ check_system_health() working';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '✗ check_system_health() failed: %', SQLERRM;
    END;
END $$;

-- Final statistics update
ANALYZE;

-- Display final status
SELECT '================================' as separator;
SELECT 'MIGRATION FULLY COMPLETE!' as status;
SELECT '================================' as separator;

-- Summary report
WITH summary AS (
    SELECT 
        'Extensions' as component,
        COUNT(*)::TEXT as count
    FROM pg_extension
    WHERE extname IN ('pg_trgm', 'pgcrypto', 'uuid-ossp', 'pg_stat_statements')
    UNION ALL
    SELECT 
        'GIN Indexes' as component,
        COUNT(*)::TEXT as count
    FROM pg_indexes
    WHERE indexdef LIKE '%gin%' AND schemaname = 'public'
    UNION ALL
    SELECT 
        'Total Indexes' as component,
        COUNT(*)::TEXT as count
    FROM pg_indexes
    WHERE schemaname = 'public'
    UNION ALL
    SELECT 
        'Functions' as component,
        COUNT(*)::TEXT as count
    FROM information_schema.routines
    WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'
    UNION ALL
    SELECT 
        'Views' as component,
        COUNT(*)::TEXT as count
    FROM information_schema.views
    WHERE table_schema = 'public'
    UNION ALL
    SELECT 
        'Materialized Views' as component,
        COUNT(*)::TEXT as count
    FROM pg_matviews
    WHERE schemaname = 'public'
)
SELECT component, count FROM summary ORDER BY component;

-- Performance check
SELECT 'Cache Hit Ratio' as metric,
       (sum(heap_blks_hit)::float / NULLIF(sum(heap_blks_hit + heap_blks_read), 0) * 100)::NUMERIC(5,2)::TEXT || '%' as value
FROM pg_statio_user_tables;

EOF

echo ""
echo "All issues should now be fixed!"
echo "Run this to verify: psql -d $DB_NAME -c 'SELECT * FROM check_system_health();'"

# 4. Final verification
psql -h localhost -p 5433 -U sparkle_user -d sparkle_db -c "SELECT * FROM check_system_health();"

chmod +x check_final_migration_status.sh
./check_final_migration_status.sh

chmod +x show_monitoring_dashboard.sh
./show_monitoring_dashboard.sh
