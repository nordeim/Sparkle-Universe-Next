-- migrations/009_monitoring_setup.sql
-- Performance monitoring and optimization tools

-- 1. Query performance monitoring
CREATE OR REPLACE VIEW slow_queries AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    stddev_time,
    rows
FROM pg_stat_statements
WHERE mean_time > 100  -- Queries taking more than 100ms
ORDER BY mean_time DESC
LIMIT 50;

-- 2. Cache hit ratio monitoring
CREATE OR REPLACE VIEW cache_hit_ratios AS
SELECT 
    'index' as cache_type,
    sum(idx_blks_hit) / NULLIF(sum(idx_blks_hit + idx_blks_read), 0) as ratio
FROM pg_statio_user_indexes
UNION ALL
SELECT 
    'table' as cache_type,
    sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit + heap_blks_read), 0) as ratio
FROM pg_statio_user_tables;

-- 3. Table bloat detection
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
            GROUP BY 1,2,3,4,5
        ) AS foo
    ) AS rs
    JOIN pg_class cc ON cc.relname = rs.tablename
    JOIN pg_namespace nn ON cc.relnamespace = nn.oid AND nn.nspname = rs.schemaname
)
SELECT
    schemaname,
    tablename,
    pg_size_pretty(bs*relpages::BIGINT) AS real_size,
    pg_size_pretty(bs*otta::BIGINT) AS expected_size,
    ROUND(CASE WHEN otta=0 THEN 0.0 ELSE (relpages-otta)::NUMERIC/relpages END,2) AS bloat_ratio
FROM bloat_info
WHERE relpages > 100
    AND (relpages-otta)::NUMERIC/relpages > 0.2
ORDER BY (relpages-otta) DESC;

-- 4. Active connections monitoring
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
    LEFT(query, 100) as query_preview
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY query_start;

-- 5. Lock monitoring
CREATE OR REPLACE VIEW blocking_locks AS
SELECT 
    blocked_locks.pid AS blocked_pid,
    blocked_activity.usename AS blocked_user,
    blocking_locks.pid AS blocking_pid,
    blocking_activity.usename AS blocking_user,
    blocked_activity.query AS blocked_statement,
    blocking_activity.query AS blocking_statement
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

-- 6. Automatic maintenance function
CREATE OR REPLACE FUNCTION perform_maintenance()
RETURNS void AS $$
BEGIN
    -- Refresh materialized views
    REFRESH MATERIALIZED VIEW CONCURRENTLY trending_posts;
    REFRESH MATERIALIZED VIEW CONCURRENTLY top_creators;
    REFRESH MATERIALIZED VIEW CONCURRENTLY active_groups;
    
    -- Update table statistics
    ANALYZE users;
    ANALYZE posts;
    ANALYZE comments;
    
    -- Clean up old partitions
    PERFORM maintain_partitions();
END;
$$ LANGUAGE plpgsql;

-- Schedule maintenance (if pg_cron is available)
-- SELECT cron.schedule('nightly-maintenance', '0 2 * * *', 'SELECT perform_maintenance()');
