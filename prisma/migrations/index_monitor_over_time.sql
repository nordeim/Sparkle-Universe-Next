-- save as: index_monitor.sql
\echo '📊 Index Usage Report'
\echo '====================='
\echo ''

-- Show index usage distribution
SELECT 
    usage_category,
    COUNT(*) as count,
    pg_size_pretty(SUM(pg_relation_size(schemaname||'.'||indexname))) as total_size
FROM index_usage_stats
GROUP BY usage_category
ORDER BY 
    CASE usage_category
        WHEN 'UNUSED' THEN 1
        WHEN 'RARELY USED' THEN 2
        WHEN 'OCCASIONALLY USED' THEN 3
        WHEN 'FREQUENTLY USED' THEN 4
    END;

\echo ''
\echo 'Top 10 Most Used Indexes:'
SELECT 
    tablename,
    indexname,
    index_scans as scans,
    index_size
FROM index_usage_stats
WHERE index_scans > 0
ORDER BY index_scans DESC
LIMIT 10;

\echo ''
\echo 'Candidates for Removal (truly unused after 7 days):'
SELECT 
    'DROP INDEX IF EXISTS ' || indexname || ';' as drop_command
FROM index_usage_stats
WHERE usage_category = 'UNUSED'
    AND indexname NOT LIKE '%_pkey'
    AND indexname NOT LIKE '%_brin'  -- Keep BRIN indexes
    AND indexname NOT LIKE '%_hash'  -- Keep hash indexes for now
LIMIT 5;
