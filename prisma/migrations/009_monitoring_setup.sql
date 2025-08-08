-- migrations/009_monitoring_setup.sql
-- Performance monitoring and optimization tools for Sparkle Universe v4.3
-- Updated with v4.3 specific monitoring and statistics optimizations

BEGIN;

-- =====================================================
-- QUERY PERFORMANCE MONITORING
-- =====================================================

-- Slow query identification
CREATE OR REPLACE VIEW slow_queries AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    stddev_time,
    rows,
    100.0 * total_time / sum(total_time) OVER () AS percentage_cpu,
    mean_time / GREATEST(rows, 1) as time_per_row
FROM pg_stat_statements
WHERE mean_time > 100  -- Queries taking more than 100ms
ORDER BY mean_time DESC
LIMIT 50;

-- Frequently executed queries
CREATE OR REPLACE VIEW frequent_queries AS
SELECT 
    query,
    calls,
    mean_time,
    calls / EXTRACT(EPOCH FROM NOW() - stats_reset) as calls_per_second,
    total_time
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
-- V4.3 INDEX EFFECTIVENESS MONITORING (NEW)
-- =====================================================

-- Monitor effectiveness of v4.3 composite indexes
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
-- TABLE BLOAT DETECTION
-- =====================================================

CREATE OR REPLACE VIEW table_bloat AS
WITH constants AS (
    SELECT current_setting('block_size')::NUMERIC AS bs
),
bloat_info AS (
    SELECT
        schemaname,
        tablename,
        cc.relpages,
        bs,
        CEIL((cc.reltuples * 
              ((datahdr + ma - (CASE WHEN datahdr%ma=0 THEN ma ELSE datahdr%ma END)) + 
               nullhdr + 4)) / (bs-20::FLOAT)) AS otta
    FROM (
        SELECT
            schemaname,
            tablename,
            (datawidth + (hdr + ma - (CASE WHEN hdr%ma=0 THEN ma ELSE hdr%ma END)))::NUMERIC AS datahdr,
            (maxfracsum * (nullhdr + ma - (CASE WHEN nullhdr%ma=0 THEN ma ELSE nullhdr%ma END))) AS nullhdr,
            hdr,
            ma,
            bs
        FROM (
            SELECT
                schemaname,
                tablename,
                hdr,
                ma,
                bs,
                SUM((1-null_frac)*avg_width) AS datawidth,
                MAX(null_frac) AS maxfracsum,
                hdr + (
                    SELECT 1 + COUNT(*)/8
                    FROM pg_stats s2
                    WHERE null_frac<>0 AND s2.schemaname = s.schemaname AND s2.tablename = s.tablename
                ) AS nullhdr
            FROM pg_stats s, constants
            WHERE schemaname = 'public'
            GROUP BY 1,2,3,4,5
        ) AS foo
    ) AS rs
    JOIN pg_class cc ON cc.relname = rs.tablename
    JOIN pg_namespace nn ON cc.relnamespace = nn.oid AND nn.nspname = rs.schemaname
    WHERE cc.relkind = 'r'
)
SELECT
    schemaname,
    tablename,
    pg_size_pretty(bs*relpages::BIGINT) AS real_size,
    pg_size_pretty(bs*otta::BIGINT) AS expected_size,
    ROUND(CASE WHEN otta=0 THEN 0.0 ELSE (relpages-otta)::NUMERIC/relpages END,2) AS bloat_ratio,
    pg_size_pretty((bs*(relpages-otta))::BIGINT) AS bloat_size
FROM bloat_info
WHERE relpages > 100
    AND (relpages-otta)::NUMERIC/relpages > 0.2
ORDER BY (bs*(relpages-otta))::BIGINT DESC;

-- =====================================================
-- INDEX BLOAT DETECTION
-- =====================================================

CREATE OR REPLACE VIEW index_bloat AS
WITH btree_index_atts AS (
    SELECT 
        nspname, 
        relname, 
        reltuples, 
        relpages, 
        indrelid, 
        relam,
        regexp_split_to_table(indkey::text, ' ')::int AS attnum,
        indexrelid as index_oid
    FROM pg_index
    JOIN pg_class ON pg_class.oid = pg_index.indexrelid
    JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
    JOIN pg_am ON pg_class.relam = pg_am.oid
    WHERE pg_am.amname = 'btree' AND pg_namespace.nspname = 'public'
),
index_item_sizes AS (
    SELECT
        ind_atts.nspname,
        ind_atts.relname,
        ind_atts.reltuples,
        ind_atts.relpages,
        ind_atts.relam,
        indrelid AS table_oid,
        index_oid,
        SUM(CASE WHEN pg_stats.null_frac <> 0 THEN 1 ELSE 0 END)::int AS nunique,
        SUM(CASE WHEN pg_stats.null_frac <> 0 THEN pg_stats.null_frac ELSE 0 END)::float AS null_frac,
        8 + SUM((1-pg_stats.null_frac)*pg_stats.avg_width) AS nulldatawidth
    FROM pg_stats
    JOIN btree_index_atts AS ind_atts ON 
        pg_stats.schemaname = ind_atts.nspname AND 
        pg_stats.tablename = ind_atts.relname AND 
        pg_stats.attname = pg_attribute.attname
    JOIN pg_attribute ON 
        pg_attribute.attrelid = ind_atts.indrelid AND 
        pg_attribute.attnum = ind_atts.attnum
    WHERE pg_attribute.attnum > 0
    GROUP BY 1, 2, 3, 4, 5, 6, 7
),
index_aligned_est AS (
    SELECT
        nspname,
        relname,
        reltuples,
        relpages,
        relam,
        table_oid,
        index_oid,
        COALESCE(
            CEIL(
                reltuples * (6 + nulldatawidth + CASE WHEN index_oid = table_oid THEN 0 ELSE 6 END) 
                / (8192 - 24)::float
            ),
            0
        ) AS expected
    FROM index_item_sizes
)
SELECT
    nspname AS schemaname,
    relname AS indexname,
    pg_size_pretty((relpages * 8192)::bigint) AS real_size,
    pg_size_pretty((expected * 8192)::bigint) AS expected_size,
    CASE WHEN relpages > expected 
        THEN pg_size_pretty(((relpages - expected) * 8192)::bigint)
        ELSE '0 bytes'
    END AS bloat_size,
    CASE WHEN relpages > expected AND expected > 0
        THEN ROUND(((relpages - expected)::float / expected)::numeric, 2)
        ELSE 0
    END AS bloat_ratio
FROM index_aligned_est
WHERE relpages > 100
ORDER BY (relpages - expected) * 8192 DESC;

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
    blocked_activity.query AS blocked_statement,
    blocking_activity.query AS blocking_statement,
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
-- STATISTICS TARGET OPTIMIZATION (NEW)
-- =====================================================

-- Increase statistics target for high-cardinality columns
-- This improves query planner accuracy for v4.3 optimizations
DO $$
BEGIN
    -- User table high-cardinality columns
    ALTER TABLE users ALTER COLUMN id SET STATISTICS 1000;
    ALTER TABLE users ALTER COLUMN username SET STATISTICS 1000;
    ALTER TABLE users ALTER COLUMN email SET STATISTICS 1000;
    
    -- Post table high-cardinality columns
    ALTER TABLE posts ALTER COLUMN id SET STATISTICS 1000;
    ALTER TABLE posts ALTER COLUMN authorId SET STATISTICS 1000;
    ALTER TABLE posts ALTER COLUMN slug SET STATISTICS 1000;
    
    -- Message table high-cardinality columns
    ALTER TABLE messages ALTER COLUMN conversationId SET STATISTICS 1000;
    ALTER TABLE messages ALTER COLUMN senderId SET STATISTICS 1000;
    
    -- Notification table high-cardinality columns
    ALTER TABLE notifications ALTER COLUMN userId SET STATISTICS 1000;
    
    -- Activity stream high-cardinality columns
    ALTER TABLE activity_streams ALTER COLUMN userId SET STATISTICS 1000;
    ALTER TABLE activity_streams ALTER COLUMN entityId SET STATISTICS 1000;
    
    -- Comment table high-cardinality columns
    ALTER TABLE comments ALTER COLUMN postId SET STATISTICS 1000;
    ALTER TABLE comments ALTER COLUMN authorId SET STATISTICS 1000;
    
    -- Force statistics update
    ANALYZE users, posts, messages, notifications, activity_streams, comments;
    
    RAISE NOTICE 'Statistics targets updated for high-cardinality columns';
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
BEGIN
    start_time := clock_timestamp();
    
    -- Refresh materialized views with timing
    RAISE NOTICE 'Starting materialized view refresh at %', start_time;
    
    REFRESH MATERIALIZED VIEW CONCURRENTLY trending_posts;
    RAISE NOTICE 'Refreshed trending_posts';
    
    REFRESH MATERIALIZED VIEW CONCURRENTLY top_creators;
    RAISE NOTICE 'Refreshed top_creators';
    
    REFRESH MATERIALIZED VIEW CONCURRENTLY active_groups;
    RAISE NOTICE 'Refreshed active_groups';
    
    -- Update table statistics for critical tables
    ANALYZE users, posts, comments, messages, notifications;
    RAISE NOTICE 'Updated table statistics';
    
    -- Clean up old partitions
    PERFORM maintain_partitions();
    RAISE NOTICE 'Maintained partitions';
    
    end_time := clock_timestamp();
    duration := end_time - start_time;
    
    -- Log maintenance completion
    INSERT INTO system_health (
        id, service, status, responseTime, metadata, checkedAt
    ) VALUES (
        gen_random_uuid(),
        'maintenance',
        'completed',
        EXTRACT(MILLISECONDS FROM duration),
        jsonb_build_object(
            'start_time', start_time,
            'end_time', end_time,
            'duration', duration::text,
            'tasks', ARRAY['materialized_views', 'statistics', 'partitions']
        ),
        NOW()
    );
    
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

-- Schedule maintenance (if pg_cron is available)
-- SELECT cron.schedule('nightly-maintenance', '0 2 * * *', 'SELECT perform_maintenance()');
-- SELECT cron.schedule('hourly-stats', '0 * * * *', 'ANALYZE;');

COMMIT;

-- Post-deployment verification
-- Monitor cache hit ratios (should be > 95%)
SELECT * FROM cache_hit_ratios;

-- Check for blocking locks
SELECT * FROM blocking_locks;

-- Review index effectiveness
SELECT * FROM v43_index_effectiveness WHERE effectiveness = 'UNUSED - Consider Removal';
