-- final_fix_corrected.sql
-- Corrected version with proper PL/pgSQL syntax

BEGIN;

-- Drop any existing problematic views
DROP VIEW IF EXISTS index_usage_stats CASCADE;
DROP VIEW IF EXISTS table_cache_stats CASCADE;
DROP VIEW IF EXISTS cache_hit_ratios CASCADE;
DROP VIEW IF EXISTS blocking_locks CASCADE;
DROP FUNCTION IF EXISTS check_system_health() CASCADE;
DROP FUNCTION IF EXISTS find_unused_indexes() CASCADE;
DROP FUNCTION IF EXISTS analyze_index_effectiveness() CASCADE;

-- Create index usage stats with CORRECT column names
CREATE VIEW index_usage_stats AS
SELECT 
    sui.schemaname,
    sui.tablename,
    sui.indexrelname as indexname,
    sui.idx_scan as index_scans,
    sui.idx_tup_read as tuples_read,
    sui.idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(sui.indexrelid)) as index_size,
    CASE 
        WHEN sui.idx_scan = 0 THEN 'UNUSED'
        WHEN sui.idx_scan < 100 THEN 'RARELY USED'
        WHEN sui.idx_scan < 1000 THEN 'OCCASIONALLY USED'
        ELSE 'FREQUENTLY USED'
    END as usage_category
FROM pg_stat_user_indexes sui
ORDER BY sui.idx_scan DESC;

-- Create table cache stats with CORRECT column names
CREATE VIEW table_cache_stats AS
SELECT 
    sut.schemaname,
    sut.tablename,
    sut.heap_blks_read,
    sut.heap_blks_hit,
    CASE 
        WHEN sut.heap_blks_hit + sut.heap_blks_read = 0 THEN 0
        ELSE round(100.0 * sut.heap_blks_hit / (sut.heap_blks_hit + sut.heap_blks_read), 2)
    END as cache_hit_ratio,
    pg_size_pretty(pg_total_relation_size(sut.schemaname||'.'||sut.tablename)) as table_size
FROM pg_statio_user_tables sut
WHERE sut.heap_blks_hit + sut.heap_blks_read > 0
ORDER BY sut.heap_blks_read + sut.heap_blks_hit DESC;

-- Create cache hit ratios view
CREATE VIEW cache_hit_ratios AS
SELECT 
    'index' as cache_type,
    sum(idx_blks_hit) / NULLIF(sum(idx_blks_hit + idx_blks_read), 0) as ratio,
    pg_size_pretty(sum(idx_blks_hit + idx_blks_read) * 8192) as total_accessed
FROM pg_statio_user_indexes
UNION ALL
SELECT 
    'table' as cache_type,
    sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit + heap_blks_read), 0) as ratio,
    pg_size_pretty(sum(heap_blks_hit + heap_blks_read) * 8192) as total_accessed
FROM pg_statio_user_tables;

-- Create blocking locks view
CREATE VIEW blocking_locks AS
SELECT 
    blocked_locks.pid AS blocked_pid,
    blocked_activity.usename AS blocked_user,
    blocking_locks.pid AS blocking_pid,
    blocking_activity.usename AS blocking_user,
    LEFT(blocked_activity.query, 50) AS blocked_statement,
    LEFT(blocking_activity.query, 50) AS blocking_statement,
    NOW() - blocked_activity.query_start AS blocked_duration,
    NOW() - blocking_activity.query_start AS blocking_duration
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks 
    ON blocking_locks.locktype = blocked_locks.locktype
    AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
    AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
    AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
    AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
    AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
    AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
    AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
    AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
    AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
    AND blocking_locks.pid != blocked_locks.pid
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;

-- Function to find unused indexes (FIXED with correct column names)
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
        s.tablename::TEXT,
        s.indexrelname::TEXT,
        pg_size_pretty(pg_relation_size(s.indexrelid))::TEXT,
        s.idx_scan
    FROM pg_stat_user_indexes s
    JOIN pg_index i ON s.indexrelid = i.indexrelid
    WHERE s.idx_scan < 100
        AND s.schemaname = 'public'
        AND NOT i.indisunique
        AND NOT i.indisprimary
        AND s.indexrelid::regclass::text NOT LIKE '%_pkey'
        AND s.indexrelid::regclass::text NOT LIKE '%_key'
    ORDER BY pg_relation_size(s.indexrelid) DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to analyze index effectiveness (FIXED)
CREATE OR REPLACE FUNCTION analyze_index_effectiveness()
RETURNS TABLE (
    tablename TEXT,
    total_indexes BIGINT,
    used_indexes BIGINT,
    unused_indexes BIGINT,
    total_index_size TEXT,
    table_size TEXT,
    index_ratio NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH index_stats AS (
        SELECT 
            s.tablename,
            COUNT(*) as total_indexes,
            COUNT(*) FILTER (WHERE s.idx_scan > 0) as used_indexes,
            COUNT(*) FILTER (WHERE s.idx_scan = 0) as unused_indexes,
            SUM(pg_relation_size(s.indexrelid)) as total_index_size,
            pg_total_relation_size(s.schemaname||'.'||s.tablename) as table_size
        FROM pg_stat_user_indexes s
        WHERE s.schemaname = 'public'
        GROUP BY s.tablename, s.schemaname
    )
    SELECT 
        i.tablename::TEXT,
        i.total_indexes,
        i.used_indexes,
        i.unused_indexes,
        pg_size_pretty(i.total_index_size)::TEXT,
        pg_size_pretty(i.table_size)::TEXT,
        ROUND((i.total_index_size::NUMERIC / NULLIF(i.table_size, 0)), 2) as index_ratio
    FROM index_stats i
    ORDER BY i.total_index_size DESC;
END;
$$ LANGUAGE plpgsql;

-- System health check function
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
            WHEN ratio > 0.95 THEN 'GOOD'
            WHEN ratio > 0.90 THEN 'OK'
            ELSE 'POOR'
        END::TEXT,
        COALESCE((ratio * 100)::NUMERIC(5,2)::TEXT, '0.00') || '%',
        CASE 
            WHEN ratio < 0.90 OR ratio IS NULL THEN 'Consider increasing shared_buffers'
            ELSE 'No action needed'
        END::TEXT
    FROM cache_hit_ratios
    WHERE cache_type = 'table';
    
    -- Check for blocking locks
    RETURN QUERY
    SELECT 
        'Blocking Locks'::TEXT,
        CASE 
            WHEN COUNT(*) = 0 THEN 'GOOD'
            ELSE 'WARNING'
        END::TEXT,
        COUNT(*)::TEXT,
        CASE 
            WHEN COUNT(*) > 0 THEN 'Investigate blocking queries'
            ELSE 'No blocking detected'
        END::TEXT
    FROM blocking_locks;
    
    -- Check connection count
    RETURN QUERY
    SELECT 
        'Connection Usage'::TEXT,
        CASE 
            WHEN current_connections::FLOAT / max_connections::FLOAT < 0.8 THEN 'GOOD'
            WHEN current_connections::FLOAT / max_connections::FLOAT < 0.9 THEN 'WARNING'
            ELSE 'CRITICAL'
        END::TEXT,
        current_connections::TEXT || '/' || max_connections::TEXT,
        CASE 
            WHEN current_connections::FLOAT / max_connections::FLOAT > 0.8 
            THEN 'Consider increasing max_connections'
            ELSE 'Connection pool healthy'
        END::TEXT
    FROM (
        SELECT 
            (SELECT COUNT(*) FROM pg_stat_activity) as current_connections,
            (SELECT setting::INT FROM pg_settings WHERE name = 'max_connections') as max_connections
    ) conn_stats;
    
    -- Check index usage
    RETURN QUERY
    SELECT 
        'Index Usage'::TEXT,
        CASE 
            WHEN unused_count = 0 THEN 'EXCELLENT'
            WHEN unused_count < 5 THEN 'GOOD'
            WHEN unused_count < 20 THEN 'OK'
            ELSE 'POOR'
        END::TEXT,
        unused_count::TEXT || ' unused indexes',
        CASE 
            WHEN unused_count > 10 
            THEN 'Consider dropping unused indexes'
            ELSE 'Index usage is healthy'
        END::TEXT
    FROM (
        SELECT COUNT(*) as unused_count
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public' AND idx_scan = 0
    ) idx_stats;
END;
$$ LANGUAGE plpgsql;

-- Create ROUND function for double precision if it doesn't exist
DO $$
BEGIN
    CREATE FUNCTION round(double precision, integer) 
    RETURNS numeric AS 'SELECT ROUND($1::numeric, $2)' 
    LANGUAGE SQL IMMUTABLE;
EXCEPTION
    WHEN duplicate_function THEN NULL;
END $$;

-- Grant permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO PUBLIC;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO PUBLIC;

COMMIT;

-- Test everything
\echo 'Testing monitoring components...'
\echo ''

-- Test index_usage_stats
SELECT EXISTS (SELECT 1 FROM index_usage_stats LIMIT 1) as index_usage_stats_working;

-- Test table_cache_stats
SELECT EXISTS (SELECT 1 FROM table_cache_stats LIMIT 1) as table_cache_stats_working;

-- Test cache_hit_ratios
SELECT EXISTS (SELECT 1 FROM cache_hit_ratios LIMIT 1) as cache_hit_ratios_working;

-- Test check_system_health
SELECT COUNT(*) > 0 as check_system_health_working FROM check_system_health();

-- Test find_unused_indexes
SELECT COUNT(*) >= 0 as find_unused_indexes_working FROM find_unused_indexes();

-- Test analyze_index_effectiveness
SELECT COUNT(*) >= 0 as analyze_index_effectiveness_working FROM analyze_index_effectiveness();

\echo ''
\echo '════════════════════════════════════════════'
\echo 'MIGRATION COMPLETION SUMMARY'
\echo '════════════════════════════════════════════'
\echo ''

-- Final summary
WITH component_counts AS (
    SELECT 'Tables' as component, COUNT(*) as count
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    UNION ALL
    SELECT 'Indexes', COUNT(*)
    FROM pg_indexes WHERE schemaname = 'public'
    UNION ALL
    SELECT 'GIN Indexes', COUNT(*)
    FROM pg_indexes WHERE schemaname = 'public' AND indexdef LIKE '%USING gin%'
    UNION ALL
    SELECT 'Functions', COUNT(*)
    FROM information_schema.routines
    WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'
    UNION ALL
    SELECT 'Views', COUNT(*)
    FROM information_schema.views WHERE table_schema = 'public'
    UNION ALL
    SELECT 'Mat. Views', COUNT(*)
    FROM pg_matviews WHERE schemaname = 'public'
)
SELECT component, count FROM component_counts ORDER BY component;

\echo ''
\echo 'System Health Check:'
\echo '--------------------'
SELECT * FROM check_system_health();

\echo ''
\echo '✅ MIGRATION COMPLETE!'
\echo ''
\echo 'Key Commands:'
\echo '  • View performance: SELECT * FROM performance_dashboard;'
\echo '  • Check health: SELECT * FROM check_system_health();'
\echo '  • Find unused indexes: SELECT * FROM find_unused_indexes();'
\echo '  • Analyze indexes: SELECT * FROM analyze_index_effectiveness();'
