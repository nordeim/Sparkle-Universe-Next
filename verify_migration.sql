-- verify_migration.sql
-- Verify all migrations completed successfully

\echo 'Sparkle Universe Migration Verification'
\echo '======================================'

-- Check extensions
\echo '\n1. Extensions Status:'
SELECT extname, extversion 
FROM pg_extension 
WHERE extname IN ('pg_trgm', 'pgcrypto', 'uuid-ossp', 'pg_stat_statements')
ORDER BY extname;

-- Check JSON indexes
\echo '\n2. JSON Index Count:'
SELECT COUNT(*) as json_index_count 
FROM pg_indexes 
WHERE indexdef LIKE '%gin%' AND schemaname = 'public';

-- Check functions
\echo '\n3. Functions Created:'
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_type = 'FUNCTION'
  AND routine_name IN (
    'calculate_user_level',
    'calculate_engagement_rate',
    'update_post_stats',
    'calculate_reputation_score'
  );

-- Check materialized views
\echo '\n4. Materialized Views:'
SELECT matviewname 
FROM pg_matviews 
WHERE schemaname = 'public';

-- Check triggers
\echo '\n5. Trigger Count by Table:'
SELECT event_object_table, COUNT(*) as trigger_count
FROM information_schema.triggers
WHERE trigger_schema = 'public'
GROUP BY event_object_table
ORDER BY trigger_count DESC
LIMIT 10;

-- Check search vectors
\echo '\n6. Full-text Search Status:'
SELECT 
    table_name,
    column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'search_vector';

\echo '\nVerification Complete!'
