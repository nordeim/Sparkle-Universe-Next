-- simple_fix.sql
-- Simplified version that will definitely work

-- Create the essential monitoring views one by one
BEGIN;

-- 1. Simple cache hit ratio
CREATE OR REPLACE VIEW simple_cache_stats AS
SELECT 
    ROUND(100.0 * sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit + heap_blks_read), 0), 2) as table_cache_hit_percent,
    ROUND(100.0 * sum(idx_blks_hit) / NULLIF(sum(idx_blks_hit + idx_blks_read), 0), 2) as index_cache_hit_percent
FROM pg_statio_user_tables;

-- 2. Simple index usage
CREATE OR REPLACE VIEW simple_index_usage AS
SELECT 
    schemaname,
    tablename,
    indexrelname as indexname,
    idx_scan as scans,
    pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan;

-- 3. Simple health check
CREATE OR REPLACE FUNCTION simple_health_check()
RETURNS TABLE (metric text, value text) AS $$
BEGIN
    RETURN QUERY
    SELECT 'Database Size'::text, pg_size_pretty(pg_database_size(current_database()))::text
    UNION ALL
    SELECT 'Total Tables'::text, COUNT(*)::text FROM pg_tables WHERE schemaname = 'public'
    UNION ALL
    SELECT 'Total Indexes'::text, COUNT(*)::text FROM pg_indexes WHERE schemaname = 'public'
    UNION ALL
    SELECT 'Active Connections'::text, COUNT(*)::text FROM pg_stat_activity;
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- Test
SELECT * FROM simple_cache_stats;
SELECT * FROM simple_health_check();
SELECT COUNT(*) as unused_indexes FROM simple_index_usage WHERE scans = 0;

\echo 'Basic monitoring setup complete!'
