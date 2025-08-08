-- migrations/009_monitoring_setup.sql
-- Performance monitoring and optimization tools for Sparkle Universe v4.3
-- FIXED: Column name case sensitivity, proper table references

BEGIN;

-- =====================================================
-- QUERY PERFORMANCE MONITORING
-- =====================================================

-- Ensure pg_stat_statements is available
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Slow query identification
CREATE OR REPLACE VIEW slow_queries AS
SELECT 
    query,
    calls,
    total_exec_time as total_time,
    mean_exec_time as mean_time,
    stddev_exec_time as stddev_time,
    rows,
    100.0 * total_exec_time / NULLIF(sum(total_exec_time) OVER (), 0) AS percentage_cpu,
    mean_exec_time / GREATEST(rows, 1) as time_per_row
FROM pg_stat_statements
WHERE mean_exec_time > 100  -- Queries taking more than 100ms
ORDER BY mean_exec_time DESC
LIMIT 50;

-- Frequently executed queries
CREATE OR REPLACE VIEW frequent_queries AS
SELECT 
    query,
    calls,
    mean_exec_time as mean_time,
    calls / GREATEST(EXTRACT(EPOCH FROM NOW() - stats_reset), 1) as calls_per_second,
    total_exec_time as total_time
FROM pg_stat_statements, pg_stat_database
WHERE pg_stat_database.datname = current_database()
ORDER BY calls DESC
LIMIT 50;

-- =====================================================
-- CACHE HIT RATIO MONITORING
-- =====================================================

CREATE OR REPLACE VIEW cache_hit_ratios AS
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

-- Detailed cache statistics by table
CREATE OR REPLACE VIEW table_cache_stats AS
SELECT 
    schemaname,
    tablename,
    heap_blks_read,
    heap_blks_hit,
    CASE 
        WHEN heap_blks_hit + heap_blks_read = 0 THEN 0
        ELSE round(100.0 * heap_blks_hit / (heap_blks_hit + heap_blks_read), 2)
    END as cache_hit_ratio,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size
FROM pg_statio_user_tables
WHERE heap_blks_hit + heap_blks_read > 0
ORDER BY heap_blks_read + heap_blks_hit DESC;

-- =====================================================
-- V4.3 INDEX EFFECTIVENESS MONITORING
-- =====================================================

CREATE OR REPLACE VIEW v43_index_effectiveness AS
SELECT 
    n.nspname as schema_name,
    t.relname as table_name,
    i.relname as index_name,
    idx.idx_scan as scans,
    idx.idx_tup_read as tuples_read,
    idx.idx_tup_fetch as tuples_fetched,
    CASE 
        WHEN idx.idx_scan = 0 THEN 0
        ELSE ROUND((idx.idx_tup_fetch::NUMERIC / idx.idx_scan), 2)
    END as avg_tuples_per_scan,
    pg_size_pretty(pg_relation_size(i.oid)) as index_size,
    CASE 
        WHEN i.relname LIKE '%v43%' THEN 'V4.3 Addition'
        WHEN i.relname LIKE '%composite%' THEN 'Composite Index'
        WHEN i.relname LIKE '%covering%' THEN 'Covering Index'
        WHEN i.relname LIKE '%partial%' THEN 'Partial Index'
        WHEN am.amname = 'gin' THEN 'GIN Index'
        ELSE 'Standard Index'
    END as index_type,
    CASE 
        WHEN idx.idx_scan = 0 THEN 'UNUSED - Consider Removal'
        WHEN idx.idx_scan < 100 THEN 'Low Usage - Monitor'
        WHEN idx.idx_tup_fetch::NUMERIC / GREATEST(idx.idx_scan, 1) > 1000 THEN 'High Impact - Effective'
        ELSE 'Normal Usage'
    END as effectiveness
FROM pg_stat_user_indexes idx
JOIN pg_index pgidx ON pgidx.indexrelid = idx.indexrelid
JOIN pg_class i ON i.oid = pgidx.indexrelid
JOIN pg_class t ON t.oid = pgidx.indrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
JOIN pg_am am ON am.oid = i.relam
WHERE n.nspname = 'public'
ORDER BY 
    CASE 
        WHEN idx.idx_scan = 0 THEN 0
        ELSE 1
    END,
    idx.idx_scan DESC;

-- =====================================================
-- TABLE BLOAT DETECTION (SIMPLIFIED)
-- =====================================================

CREATE OR REPLACE VIEW table_bloat_simple AS
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    n_live_tup as live_tuples,
    n_dead_tup as dead_tuples,
    CASE 
        WHEN n_live_tup > 0 
        THEN ROUND(100.0 * n_dead_tup / n_live_tup, 2)
        ELSE 0
    END as bloat_percentage,
    last_vacuum,
    last_autovacuum
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC;

-- =====================================================
-- ACTIVE CONNECTIONS MONITORING
-- =====================================================

CREATE OR REPLACE VIEW active_connections AS
SELECT 
    pid,
    usename,
    application_name,
    client_addr,
    backend_start,
    state,
    state_change,
    query_start,
    wait_event_type,
    wait_event,
    LEFT(query, 100) as query_preview
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY 
    CASE state 
        WHEN 'active' THEN 1 
        WHEN 'idle in transaction' THEN 2 
        ELSE 3 
    END,
    query_start;

-- Connection count by state
CREATE OR REPLACE VIEW connection_stats AS
SELECT 
    state,
    COUNT(*) as connection_count,
    MAX(NOW() - query_start) as max_duration,
    AVG(NOW() - query_start) as avg_duration
FROM pg_stat_activity
WHERE pid != pg_backend_pid()
GROUP BY state
ORDER BY connection_count DESC;

-- =====================================================
-- LOCK MONITORING
-- =====================================================

CREATE OR REPLACE VIEW blocking_locks AS
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

-- =====================================================
-- STATISTICS TARGET OPTIMIZATION
-- =====================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Check if tables exist before altering
    FOR r IN (
        SELECT table_name, column_name, statistics_target
        FROM (VALUES
            ('users', 'id', 1000),
            ('users', 'username', 1000),
            ('users', 'email', 1000),
            ('posts', 'id', 1000),
            ('posts', '"authorId"', 1000),
            ('posts', 'slug', 1000),
            ('messages', '"conversationId"', 1000),
            ('messages', '"senderId"', 1000),
            ('notifications', '"userId"', 1000),
            ('activity_streams', '"userId"', 1000),
            ('activity_streams', '"entityId"', 1000),
            ('comments', '"postId"', 1000),
            ('comments', '"authorId"', 1000)
        ) AS t(table_name, column_name, statistics_target)
    ) LOOP
        -- Check if table and column exist
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = r.table_name 
            AND column_name = replace(r.column_name, '"', '')
        ) THEN
            EXECUTE format('ALTER TABLE %I ALTER COLUMN %s SET STATISTICS %s',
                          r.table_name, r.column_name, r.statistics_target);
            RAISE NOTICE 'Set statistics target for %.% to %', 
                        r.table_name, r.column_name, r.statistics_target;
        ELSE
            RAISE NOTICE 'Column %.% does not exist, skipping', 
                        r.table_name, r.column_name;
        END IF;
    END LOOP;
    
    -- Force statistics update on existing tables
    FOR r IN (
        SELECT DISTINCT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'posts', 'messages', 'notifications', 'activity_streams', 'comments')
    ) LOOP
        EXECUTE format('ANALYZE %I', r.table_name);
        RAISE NOTICE 'Analyzed table %', r.table_name;
    END LOOP;
END $$;

-- =====================================================
-- AUTOMATIC MAINTENANCE FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION perform_maintenance()
RETURNS void AS $$
DECLARE
    start_time timestamp;
    end_time timestamp;
    duration interval;
    mv_exists boolean;
BEGIN
    start_time := clock_timestamp();
    
    RAISE NOTICE 'Starting maintenance at %', start_time;
    
    -- Check and refresh materialized views if they exist
    SELECT EXISTS (
        SELECT 1 FROM pg_matviews WHERE matviewname = 'trending_posts'
    ) INTO mv_exists;
    
    IF mv_exists THEN
        REFRESH MATERIALIZED VIEW CONCURRENTLY trending_posts;
        RAISE NOTICE 'Refreshed trending_posts';
    END IF;
    
    SELECT EXISTS (
        SELECT 1 FROM pg_matviews WHERE matviewname = 'top_creators'
    ) INTO mv_exists;
    
    IF mv_exists THEN
        REFRESH MATERIALIZED VIEW CONCURRENTLY top_creators;
        RAISE NOTICE 'Refreshed top_creators';
    END IF;
    
    SELECT EXISTS (
        SELECT 1 FROM pg_matviews WHERE matviewname = 'active_groups'
    ) INTO mv_exists;
    
    IF mv_exists THEN
        REFRESH MATERIALIZED VIEW CONCURRENTLY active_groups;
        RAISE NOTICE 'Refreshed active_groups';
    END IF;
    
    -- Update table statistics for critical tables
    ANALYZE users, posts, comments, messages, notifications;
    RAISE NOTICE 'Updated table statistics';
    
    -- Clean up old partitions if function exists
    IF EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'maintain_partitions'
    ) THEN
        PERFORM maintain_partitions();
        RAISE NOTICE 'Maintained partitions';
    END IF;
    
    end_time := clock_timestamp();
    duration := end_time - start_time;
    
    -- Log maintenance completion if table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name = 'system_health'
    ) THEN
        INSERT INTO system_health (
            id, service, status, "responseTime", metadata, "checkedAt"
        ) VALUES (
            gen_random_uuid()::text,
            'maintenance',
            'healthy',
            EXTRACT(MILLISECONDS FROM duration),
            jsonb_build_object(
                'start_time', start_time,
                'end_time', end_time,
                'duration', duration::text,
                'tasks', ARRAY['materialized_views', 'statistics', 'partitions']
            ),
            NOW()
        );
    END IF;
    
    RAISE NOTICE 'Maintenance completed in %', duration;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PERFORMANCE DASHBOARD VIEW
-- =====================================================

CREATE OR REPLACE VIEW performance_dashboard AS
WITH cache_stats AS (
    SELECT 
        ROUND(100.0 * sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit + heap_blks_read), 0), 2) as table_cache_hit_ratio,
        ROUND(100.0 * sum(idx_blks_hit) / NULLIF(sum(idx_blks_hit + idx_blks_read), 0), 2) as index_cache_hit_ratio
    FROM pg_statio_user_tables
),
connection_info AS (
    SELECT 
        COUNT(*) as total_connections,
        COUNT(*) FILTER (WHERE state = 'active') as active_queries,
        COUNT(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction,
        MAX(EXTRACT(EPOCH FROM (NOW() - query_start))) FILTER (WHERE state = 'active') as longest_query_seconds
    FROM pg_stat_activity
    WHERE pid != pg_backend_pid()
),
db_size AS (
    SELECT 
        pg_database_size(current_database()) as database_size,
        pg_size_pretty(pg_database_size(current_database())) as database_size_pretty
)
SELECT 
    cs.table_cache_hit_ratio,
    cs.index_cache_hit_ratio,
    ci.total_connections,
    ci.active_queries,
    ci.idle_in_transaction,
    ci.longest_query_seconds,
    ds.database_size_pretty,
    (SELECT COUNT(*) FROM pg_stat_user_tables) as table_count,
    (SELECT COUNT(*) FROM pg_stat_user_indexes) as index_count,
    NOW() as last_updated
FROM cache_stats cs, connection_info ci, db_size ds;

-- =====================================================
-- MONITORING HELPER FUNCTIONS
-- =====================================================

-- Function to check system health
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
        ROUND(ratio * 100, 2)::TEXT || '%',
        CASE 
            WHEN ratio < 0.90 THEN 'Consider increasing shared_buffers'
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
    
    -- Check table bloat
    RETURN QUERY
    SELECT 
        'Table Bloat'::TEXT,
        CASE 
            WHEN MAX(bloat_percentage) < 20 THEN 'GOOD'
            WHEN MAX(bloat_percentage) < 40 THEN 'WARNING'
            ELSE 'CRITICAL'
        END::TEXT,
        'Max: ' || MAX(bloat_percentage)::TEXT || '%',
        CASE 
            WHEN MAX(bloat_percentage) > 20 
            THEN 'Run VACUUM on bloated tables'
            ELSE 'Bloat within acceptable limits'
        END::TEXT
    FROM table_bloat_simple;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO PUBLIC;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO PUBLIC;

COMMIT;

-- =====================================================
-- POST-DEPLOYMENT VERIFICATION
-- =====================================================

-- Check system health
SELECT * FROM check_system_health();

-- Monitor cache hit ratios (should be > 95%)
SELECT * FROM cache_hit_ratios;

-- Check for any blocking locks
SELECT * FROM blocking_locks;

-- Review performance dashboard
SELECT * FROM performance_dashboard;
