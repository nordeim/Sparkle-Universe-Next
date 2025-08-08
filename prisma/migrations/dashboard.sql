-- dashboard.sql
-- Quick performance dashboard

\echo '╔══════════════════════════════════════════════════════╗'
\echo '║           SPARKLE UNIVERSE DATABASE DASHBOARD         ║'
\echo '╚══════════════════════════════════════════════════════╝'
\echo ''

SELECT NOW() as "Current Time";
\echo ''

\echo '📊 Performance Metrics:'
\echo '----------------------'
SELECT * FROM simple_cache_stats;
\echo ''

\echo '🏥 Health Status:'
\echo '----------------'
SELECT * FROM check_system_health();
\echo ''

\echo '📈 Database Statistics:'
\echo '----------------------'
SELECT 
    pg_size_pretty(pg_database_size(current_database())) as "Database Size",
    (SELECT COUNT(*) FROM pg_stat_activity) as "Active Connections",
    (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public') as "Total Tables",
    (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public') as "Total Indexes"
;
\echo ''

\echo '🔍 Top 5 Largest Tables:'
\echo '------------------------'
SELECT 
    relname as table_name,
    pg_size_pretty(pg_total_relation_size(relid)) as total_size
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 5;
