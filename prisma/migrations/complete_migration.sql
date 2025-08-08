-- complete_migration.sql
-- Completes any missing pieces from the migration

-- Check and create performance dashboard if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_name = 'performance_dashboard'
    ) THEN
        CREATE VIEW performance_dashboard AS
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
        
        RAISE NOTICE 'Created performance_dashboard view';
    END IF;
END $$;

-- Ensure all search vectors are updated
UPDATE posts 
SET search_vector = 
    setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(excerpt, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(content::text, '')), 'C')
WHERE search_vector IS NULL;

UPDATE users 
SET search_vector = 
    setweight(to_tsvector('english', COALESCE(username, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(email, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(bio, '')), 'C')
WHERE search_vector IS NULL;

-- Final statistics update
ANALYZE;

-- Display summary
SELECT 'Migration Status Report' as report;
SELECT '======================' as separator;

SELECT 
    'Extensions' as component,
    COUNT(*) as count,
    string_agg(extname, ', ') as items
FROM pg_extension
WHERE extname IN ('pg_trgm', 'pgcrypto', 'uuid-ossp', 'pg_stat_statements');

SELECT 
    'GIN Indexes' as component,
    COUNT(*) as count,
    NULL as items
FROM pg_indexes
WHERE indexdef LIKE '%gin%' AND schemaname = 'public';

SELECT 
    'Custom Functions' as component,
    COUNT(*) as count,
    NULL as items
FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';

SELECT 
    'Materialized Views' as component,
    COUNT(*) as count,
    string_agg(matviewname, ', ') as items
FROM pg_matviews
WHERE schemaname = 'public';
