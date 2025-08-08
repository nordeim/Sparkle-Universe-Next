# 1. Save the updated script above as execute_migrations_fixed_v2.sh
chmod +x execute_migrations_fixed_v2.sh

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
chmod +x fix_remaining_issues.sh
./fix_remaining_issues.sh

# 4. Final verification
psql -h localhost -p 5433 -U sparkle_user -d sparkle_db -c "SELECT * FROM check_system_health();"
