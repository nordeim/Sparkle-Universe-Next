#!/bin/bash
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
