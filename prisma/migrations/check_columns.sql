-- check_columns.sql
-- Let's see what columns are actually available

\d pg_stat_user_indexes

-- Alternative way to check
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'pg_stat_user_indexes'
ORDER BY ordinal_position;
