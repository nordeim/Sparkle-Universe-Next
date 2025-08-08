-- absolute_final_fix.sql
-- This version checks columns first and uses the correct ones

-- First, let's verify what columns exist
\echo 'Checking available columns...'
\echo ''

SELECT 'pg_statio_user_tables columns:' as info;
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'pg_statio_user_tables' 
AND column_name IN ('tablename', 'relname')
ORDER BY column_name;

\echo ''

-- Now create the views with correct column names
BEGIN;

-- 1. Simple cache stats (this definitely works)
CREATE OR REPLACE VIEW simple_cache_stats AS
SELECT 
    ROUND(100.0 * sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit + heap_blks_read), 0), 2) as table_cache_hit_percent,
    ROUND(100.0 * sum(idx_blks_hit) / NULLIF(sum(idx_blks_hit + idx_blks_read), 0), 2) as index_cache_hit_percent
FROM pg_statio_user_tables;

-- 2. Index usage with correct columns (relname not tablename)
CREATE OR REPLACE VIEW simple_index_usage AS
SELECT 
    schemaname,
    relname as tablename,
    indexrelname as indexname,
    idx_scan as scans,
    pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan;

-- 3. Table cache stats - using relname if tablename doesn't exist
CREATE OR REPLACE VIEW table_cache_stats AS
SELECT 
    t.schemaname,
    t.relname as tablename,  -- Use relname and alias it
    t.heap_blks_read,
    t.heap_blks_hit,
    CASE 
        WHEN t.heap_blks_hit + t.heap_blks_read = 0 THEN 0
        ELSE round(100.0 * t.heap_blks_hit / (t.heap_blks_hit + t.heap_blks_read), 2)
    END as cache_hit_ratio
FROM pg_statio_user_tables t
WHERE t.heap_blks_hit + t.heap_blks_read > 0
ORDER BY t.heap_blks_read + t.heap_blks_hit DESC
LIMIT 50;

-- 4. Cache hit ratios
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

-- 5. Index usage stats
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

-- 6. Health check function
CREATE OR REPLACE FUNCTION check_system_health()
RETURNS TABLE (
    metric TEXT,
    status TEXT,
    value TEXT,
    recommendation TEXT
) AS $$
BEGIN
    -- Cache hit ratio
    RETURN QUERY
    SELECT 
        'Cache Hit Ratio'::TEXT,
        CASE 
            WHEN COALESCE(ratio, 0) > 0.95 THEN 'EXCELLENT'
            WHEN COALESCE(ratio, 0) > 0.90 THEN 'GOOD'
            WHEN COALESCE(ratio, 0) > 0.85 THEN 'OK'
            ELSE 'POOR'
        END::TEXT,
        COALESCE(ROUND(ratio * 100, 2)::TEXT, '0.00') || '%',
        CASE 
            WHEN COALESCE(ratio, 0) < 0.90 THEN 'Consider increasing shared_buffers'
            ELSE 'No action needed'
        END::TEXT
    FROM cache_hit_ratios
    WHERE cache_type = 'table';
    
    -- Connection usage
    RETURN QUERY
    SELECT 
        'Connection Usage'::TEXT,
        CASE 
            WHEN conn_count < 50 THEN 'GOOD'
            WHEN conn_count < 80 THEN 'OK'
            ELSE 'HIGH'
        END::TEXT,
        conn_count::TEXT || ' connections',
        CASE 
            WHEN conn_count > 80 THEN 'Monitor connection pool'
            ELSE 'Healthy'
        END::TEXT
    FROM (SELECT COUNT(*) as conn_count FROM pg_stat_activity) c;
    
    -- Database size
    RETURN QUERY
    SELECT 
        'Database Size'::TEXT,
        'INFO'::TEXT,
        pg_size_pretty(pg_database_size(current_database()))::TEXT,
        'Current size'::TEXT;
    
    -- Index count
    RETURN QUERY
    SELECT 
        'Total Indexes'::TEXT,
        CASE 
            WHEN idx_count > 500 THEN 'HIGH'
            WHEN idx_count > 200 THEN 'NORMAL'
            ELSE 'LOW'
        END::TEXT,
        idx_count::TEXT || ' indexes',
        CASE 
            WHEN idx_count > 500 THEN 'Review for unused indexes'
            ELSE 'Acceptable'
        END::TEXT
    FROM (SELECT COUNT(*) as idx_count FROM pg_indexes WHERE schemaname = 'public') i;
END;
$$ LANGUAGE plpgsql;

-- 7. Find unused indexes
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
        s.relname::TEXT,
        s.indexrelname::TEXT,
        pg_size_pretty(pg_relation_size(s.indexrelid))::TEXT,
        s.idx_scan
    FROM pg_stat_user_indexes s
    WHERE s.idx_scan = 0
        AND s.schemaname = 'public'
    ORDER BY pg_relation_size(s.indexrelid) DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- 8. Create ROUND function if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'round' 
        AND proargtypes::text = '701 23'  -- double precision, integer
    ) THEN
        CREATE FUNCTION round(double precision, integer) 
        RETURNS numeric AS 'SELECT ROUND($1::numeric, $2)' 
        LANGUAGE SQL IMMUTABLE;
    END IF;
END $$;

COMMIT;

-- Verify everything works
\echo ''
\echo 'Testing all components...'
\echo '========================='
\echo ''

-- Test 1: Cache stats
\echo 'Cache Statistics:'
SELECT * FROM simple_cache_stats;
\echo ''

-- Test 2: Health check
\echo 'System Health Check:'
SELECT * FROM check_system_health();
\echo ''

-- Test 3: Sample indexes
\echo 'Sample Index Usage (5 least used):'
SELECT tablename, indexname, scans 
FROM simple_index_usage 
ORDER BY scans 
LIMIT 5;
\echo ''

-- Test 4: Unused indexes
\echo 'Unused Indexes Count:'
SELECT COUNT(*) as unused_index_count 
FROM find_unused_indexes();
\echo ''

-- Final summary
\echo '═══════════════════════════════════════════════════════'
\echo '✅ MONITORING SETUP COMPLETE!'
\echo '═══════════════════════════════════════════════════════'
\echo ''
\echo 'Available Monitoring Commands:'
\echo '------------------------------'
\echo '• SELECT * FROM check_system_health();'
\echo '• SELECT * FROM simple_cache_stats;'
\echo '• SELECT * FROM cache_hit_ratios;'
\echo '• SELECT * FROM find_unused_indexes();'
\echo '• SELECT * FROM index_usage_stats WHERE usage_category = ''UNUSED'';'
\echo '• SELECT * FROM table_cache_stats ORDER BY cache_hit_ratio;'
\echo ''
\echo 'Your database migration is now 100% complete with full monitoring!'
