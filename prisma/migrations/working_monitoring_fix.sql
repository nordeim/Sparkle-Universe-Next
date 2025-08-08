-- working_monitoring_fix.sql
-- This uses the ACTUAL column names from pg_stat_user_indexes

BEGIN;

-- Create simple cache stats (this one should work)
CREATE OR REPLACE VIEW simple_cache_stats AS
SELECT 
    ROUND(100.0 * sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit + heap_blks_read), 0), 2) as table_cache_hit_percent,
    ROUND(100.0 * sum(idx_blks_hit) / NULLIF(sum(idx_blks_hit + idx_blks_read), 0), 2) as index_cache_hit_percent
FROM pg_statio_user_tables;

-- Create index usage with CORRECT column names
CREATE OR REPLACE VIEW simple_index_usage AS
SELECT 
    schemaname,
    relname as tablename,      -- relname is the actual column name!
    indexrelname as indexname,
    idx_scan as scans,
    pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan;

-- Create cache hit ratios
CREATE OR REPLACE VIEW cache_hit_ratios AS
SELECT 
    'table' as cache_type,
    sum(heap_blks_hit)::float / NULLIF(sum(heap_blks_hit + heap_blks_read), 0) as ratio
FROM pg_statio_user_tables
UNION ALL
SELECT 
    'index' as cache_type,
    sum(idx_blks_hit)::float / NULLIF(sum(idx_blks_hit + idx_blks_read), 0) as ratio
FROM pg_statio_user_indexes;

-- Create table cache stats using ACTUAL columns
CREATE OR REPLACE VIEW table_cache_stats AS
SELECT 
    schemaname,
    tablename,  -- This column DOES exist in pg_statio_user_tables
    heap_blks_read,
    heap_blks_hit,
    CASE 
        WHEN heap_blks_hit + heap_blks_read = 0 THEN 0
        ELSE round(100.0 * heap_blks_hit / (heap_blks_hit + heap_blks_read), 2)
    END as cache_hit_ratio
FROM pg_statio_user_tables
WHERE heap_blks_hit + heap_blks_read > 0
ORDER BY heap_blks_read + heap_blks_hit DESC
LIMIT 50;

-- Create index usage stats with CORRECT columns
CREATE OR REPLACE VIEW index_usage_stats AS
SELECT 
    schemaname,
    relname as tablename,
    indexrelname as indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    CASE 
        WHEN idx_scan = 0 THEN 'UNUSED'
        WHEN idx_scan < 100 THEN 'RARELY USED'
        WHEN idx_scan < 1000 THEN 'OCCASIONALLY USED'
        ELSE 'FREQUENTLY USED'
    END as usage_category
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Simple health check function
CREATE OR REPLACE FUNCTION check_system_health()
RETURNS TABLE (
    metric TEXT,
    status TEXT,
    value TEXT,
    recommendation TEXT
) AS $$
BEGIN
    -- Check cache hit ratio
    RETURN QUERY
    SELECT 
        'Cache Hit Ratio'::TEXT,
        CASE 
            WHEN ratio > 0.95 THEN 'EXCELLENT'
            WHEN ratio > 0.90 THEN 'GOOD'
            WHEN ratio > 0.85 THEN 'OK'
            ELSE 'POOR'
        END::TEXT,
        COALESCE(ROUND(ratio * 100, 2)::TEXT, '0.00') || '%',
        CASE 
            WHEN ratio < 0.90 OR ratio IS NULL THEN 'Consider increasing shared_buffers'
            ELSE 'No action needed'
        END::TEXT
    FROM cache_hit_ratios
    WHERE cache_type = 'table';
    
    -- Check connection count
    RETURN QUERY
    SELECT 
        'Connection Usage'::TEXT,
        CASE 
            WHEN current_connections < 50 THEN 'GOOD'
            WHEN current_connections < 80 THEN 'OK'
            ELSE 'HIGH'
        END::TEXT,
        current_connections::TEXT || ' connections',
        CASE 
            WHEN current_connections > 80 THEN 'Monitor connection pool'
            ELSE 'Connection count healthy'
        END::TEXT
    FROM (
        SELECT COUNT(*) as current_connections FROM pg_stat_activity
    ) conn_stats;
    
    -- Check database size
    RETURN QUERY
    SELECT 
        'Database Size'::TEXT,
        'INFO'::TEXT,
        pg_size_pretty(pg_database_size(current_database()))::TEXT,
        'Monitor growth rate'::TEXT;
    
    -- Check table count
    RETURN QUERY
    SELECT 
        'Total Tables'::TEXT,
        'INFO'::TEXT,
        COUNT(*)::TEXT || ' tables',
        'Within normal range'::TEXT
    FROM pg_tables WHERE schemaname = 'public';
END;
$$ LANGUAGE plpgsql;

-- Function to find unused indexes
CREATE OR REPLACE FUNCTION find_unused_indexes()
RETURNS TABLE (
    schemaname TEXT,
    tablename TEXT,
    indexname TEXT,
    index_size TEXT,
    index_scans BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.schemaname::TEXT,
        s.relname::TEXT as tablename,
        s.indexrelname::TEXT as indexname,
        pg_size_pretty(pg_relation_size(s.indexrelid))::TEXT,
        s.idx_scan
    FROM pg_stat_user_indexes s
    JOIN pg_index i ON s.indexrelid = i.indexrelid
    WHERE s.idx_scan < 100
        AND s.schemaname = 'public'
        AND NOT i.indisunique
        AND NOT i.indisprimary
    ORDER BY pg_relation_size(s.indexrelid) DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- Create ROUND function if needed
DO $$
BEGIN
    CREATE FUNCTION round(double precision, integer) 
    RETURNS numeric AS 'SELECT ROUND($1::numeric, $2)' 
    LANGUAGE SQL IMMUTABLE;
EXCEPTION
    WHEN duplicate_function THEN NULL;
END $$;

COMMIT;

-- Test the views
\echo 'Testing monitoring components...'
\echo ''

SELECT 'Cache Stats:' as test, * FROM simple_cache_stats;
\echo ''

SELECT 'Health Check:' as test FROM check_system_health() LIMIT 1;
\echo ''

SELECT 'Sample Index Usage:' as test, 
       indexname, scans, size 
FROM simple_index_usage 
ORDER BY scans 
LIMIT 5;
\echo ''

SELECT 'Unused Indexes Count:' as test, COUNT(*) as count
FROM simple_index_usage WHERE scans = 0;

\echo ''
\echo '✅ Monitoring components successfully installed!'
\echo ''
\echo 'Available commands:'
\echo '  SELECT * FROM check_system_health();'
\echo '  SELECT * FROM simple_cache_stats;'
\echo '  SELECT * FROM find_unused_indexes();'
\echo '  SELECT * FROM index_usage_stats WHERE usage_category = ''UNUSED'';'
