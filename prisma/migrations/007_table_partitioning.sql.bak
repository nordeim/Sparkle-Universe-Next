-- migrations/007_table_partitioning.sql
-- Table partitioning for performance
-- Updated with messaging tables and improved automation

BEGIN;

-- =====================================================
-- ANALYTICS EVENTS PARTITIONING (BY MONTH)
-- =====================================================

-- Rename existing table
ALTER TABLE analytics_events RENAME TO analytics_events_old;

-- Create partitioned table
CREATE TABLE analytics_events (
    LIKE analytics_events_old INCLUDING ALL
) PARTITION BY RANGE (timestamp);

-- Create initial partitions
CREATE TABLE analytics_events_2024_01 PARTITION OF analytics_events
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE analytics_events_2024_02 PARTITION OF analytics_events
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

CREATE TABLE analytics_events_2024_03 PARTITION OF analytics_events
    FOR VALUES FROM ('2024-03-01') TO ('2024-04-01');

-- Migrate data
INSERT INTO analytics_events SELECT * FROM analytics_events_old;

-- Drop old table
DROP TABLE analytics_events_old;

-- =====================================================
-- ACTIVITY STREAMS PARTITIONING (BY MONTH)
-- =====================================================

-- Rename existing table
ALTER TABLE activity_streams RENAME TO activity_streams_old;

-- Create partitioned table
CREATE TABLE activity_streams (
    LIKE activity_streams_old INCLUDING ALL
) PARTITION BY RANGE (createdAt);

-- Create initial partitions
CREATE TABLE activity_streams_2024_01 PARTITION OF activity_streams
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE activity_streams_2024_02 PARTITION OF activity_streams
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

CREATE TABLE activity_streams_2024_03 PARTITION OF activity_streams
    FOR VALUES FROM ('2024-03-01') TO ('2024-04-01');

-- Migrate data
INSERT INTO activity_streams SELECT * FROM activity_streams_old;
DROP TABLE activity_streams_old;

-- =====================================================
-- AUDIT LOGS PARTITIONING (BY ACTION TYPE)
-- =====================================================

-- Rename existing table
ALTER TABLE audit_logs RENAME TO audit_logs_old;

-- Create partitioned table
CREATE TABLE audit_logs (
    LIKE audit_logs_old INCLUDING ALL
) PARTITION BY LIST (action);

-- Create partitions by action type
CREATE TABLE audit_logs_auth PARTITION OF audit_logs
    FOR VALUES IN ('LOGIN', 'LOGOUT', 'PERMISSION_CHANGE');

CREATE TABLE audit_logs_crud PARTITION OF audit_logs
    FOR VALUES IN ('CREATE', 'UPDATE', 'DELETE');

CREATE TABLE audit_logs_system PARTITION OF audit_logs
    FOR VALUES IN ('MODERATION_ACTION', 'SYSTEM_ACTION');

-- Migrate data
INSERT INTO audit_logs SELECT * FROM audit_logs_old;
DROP TABLE audit_logs_old;

-- =====================================================
-- MESSAGES PARTITIONING (BY CONVERSATION)
-- =====================================================

-- Note: For messages, we'll use hash partitioning by conversationId
-- This distributes messages evenly across partitions

-- Rename existing table
ALTER TABLE messages RENAME TO messages_old;

-- Create partitioned table
CREATE TABLE messages (
    LIKE messages_old INCLUDING ALL
) PARTITION BY HASH (conversationId);

-- Create 10 hash partitions for even distribution
CREATE TABLE messages_p0 PARTITION OF messages
    FOR VALUES WITH (MODULUS 10, REMAINDER 0);

CREATE TABLE messages_p1 PARTITION OF messages
    FOR VALUES WITH (MODULUS 10, REMAINDER 1);

CREATE TABLE messages_p2 PARTITION OF messages
    FOR VALUES WITH (MODULUS 10, REMAINDER 2);

CREATE TABLE messages_p3 PARTITION OF messages
    FOR VALUES WITH (MODULUS 10, REMAINDER 3);

CREATE TABLE messages_p4 PARTITION OF messages
    FOR VALUES WITH (MODULUS 10, REMAINDER 4);

CREATE TABLE messages_p5 PARTITION OF messages
    FOR VALUES WITH (MODULUS 10, REMAINDER 5);

CREATE TABLE messages_p6 PARTITION OF messages
    FOR VALUES WITH (MODULUS 10, REMAINDER 6);

CREATE TABLE messages_p7 PARTITION OF messages
    FOR VALUES WITH (MODULUS 10, REMAINDER 7);

CREATE TABLE messages_p8 PARTITION OF messages
    FOR VALUES WITH (MODULUS 10, REMAINDER 8);

CREATE TABLE messages_p9 PARTITION OF messages
    FOR VALUES WITH (MODULUS 10, REMAINDER 9);

-- Migrate data
INSERT INTO messages SELECT * FROM messages_old;
DROP TABLE messages_old;

-- =====================================================
-- NOTIFICATIONS PARTITIONING (BY USER HASH)
-- =====================================================

-- Rename existing table
ALTER TABLE notifications RENAME TO notifications_old;

-- Create partitioned table
CREATE TABLE notifications (
    LIKE notifications_old INCLUDING ALL
) PARTITION BY HASH (userId);

-- Create 8 hash partitions
CREATE TABLE notifications_p0 PARTITION OF notifications
    FOR VALUES WITH (MODULUS 8, REMAINDER 0);

CREATE TABLE notifications_p1 PARTITION OF notifications
    FOR VALUES WITH (MODULUS 8, REMAINDER 1);

CREATE TABLE notifications_p2 PARTITION OF notifications
    FOR VALUES WITH (MODULUS 8, REMAINDER 2);

CREATE TABLE notifications_p3 PARTITION OF notifications
    FOR VALUES WITH (MODULUS 8, REMAINDER 3);

CREATE TABLE notifications_p4 PARTITION OF notifications
    FOR VALUES WITH (MODULUS 8, REMAINDER 4);

CREATE TABLE notifications_p5 PARTITION OF notifications
    FOR VALUES WITH (MODULUS 8, REMAINDER 5);

CREATE TABLE notifications_p6 PARTITION OF notifications
    FOR VALUES WITH (MODULUS 8, REMAINDER 6);

CREATE TABLE notifications_p7 PARTITION OF notifications
    FOR VALUES WITH (MODULUS 8, REMAINDER 7);

-- Migrate data
INSERT INTO notifications SELECT * FROM notifications_old;
DROP TABLE notifications_old;

-- =====================================================
-- XP LOGS PARTITIONING (BY MONTH)
-- =====================================================

-- Rename existing table
ALTER TABLE xp_logs RENAME TO xp_logs_old;

-- Create partitioned table
CREATE TABLE xp_logs (
    LIKE xp_logs_old INCLUDING ALL
) PARTITION BY RANGE (createdAt);

-- Create initial partitions
CREATE TABLE xp_logs_2024_01 PARTITION OF xp_logs
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE xp_logs_2024_02 PARTITION OF xp_logs
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

CREATE TABLE xp_logs_2024_03 PARTITION OF xp_logs
    FOR VALUES FROM ('2024-03-01') TO ('2024-04-01');

-- Migrate data
INSERT INTO xp_logs SELECT * FROM xp_logs_old;
DROP TABLE xp_logs_old;

-- =====================================================
-- CURRENCY TRANSACTIONS PARTITIONING (BY MONTH)
-- =====================================================

-- Rename existing table
ALTER TABLE currency_transactions RENAME TO currency_transactions_old;

-- Create partitioned table
CREATE TABLE currency_transactions (
    LIKE currency_transactions_old INCLUDING ALL
) PARTITION BY RANGE (createdAt);

-- Create initial partitions
CREATE TABLE currency_transactions_2024_01 PARTITION OF currency_transactions
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE currency_transactions_2024_02 PARTITION OF currency_transactions
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

CREATE TABLE currency_transactions_2024_03 PARTITION OF currency_transactions
    FOR VALUES FROM ('2024-03-01') TO ('2024-04-01');

-- Migrate data
INSERT INTO currency_transactions SELECT * FROM currency_transactions_old;
DROP TABLE currency_transactions_old;

-- =====================================================
-- PARTITION MAINTENANCE FUNCTIONS
-- =====================================================

-- Function to create monthly partitions
CREATE OR REPLACE FUNCTION create_monthly_partition(
    table_name TEXT,
    start_date DATE
)
RETURNS void AS $$
DECLARE
    partition_name TEXT;
    start_date_str TEXT;
    end_date_str TEXT;
BEGIN
    partition_name := table_name || '_' || to_char(start_date, 'YYYY_MM');
    start_date_str := to_char(start_date, 'YYYY-MM-DD');
    end_date_str := to_char(start_date + INTERVAL '1 month', 'YYYY-MM-DD');
    
    -- Check if partition already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_class
        WHERE relname = partition_name
        AND relkind = 'r'
    ) THEN
        EXECUTE format(
            'CREATE TABLE %I PARTITION OF %I 
             FOR VALUES FROM (%L) TO (%L)',
            partition_name,
            table_name,
            start_date_str,
            end_date_str
        );
        
        RAISE NOTICE 'Created partition % for table %', partition_name, table_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to drop old partitions
CREATE OR REPLACE FUNCTION drop_old_partitions(
    table_name TEXT,
    retention_months INT DEFAULT 12
)
RETURNS void AS $$
DECLARE
    partition RECORD;
    cutoff_date DATE;
BEGIN
    cutoff_date := CURRENT_DATE - (retention_months || ' months')::INTERVAL;
    
    FOR partition IN
        SELECT 
            schemaname,
            tablename
        FROM pg_tables
        WHERE tablename LIKE table_name || '_%'
            AND tablename ~ '\d{4}_\d{2}$'
    LOOP
        -- Extract date from partition name
        IF to_date(right(partition.tablename, 7), 'YYYY_MM') < cutoff_date THEN
            EXECUTE format('DROP TABLE %I.%I', partition.schemaname, partition.tablename);
            RAISE NOTICE 'Dropped old partition %.%', partition.schemaname, partition.tablename;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Main maintenance function
CREATE OR REPLACE FUNCTION maintain_partitions()
RETURNS void AS $$
DECLARE
    current_date DATE := CURRENT_DATE;
    future_date DATE;
    tables_to_partition TEXT[] := ARRAY[
        'analytics_events',
        'activity_streams',
        'xp_logs',
        'currency_transactions'
    ];
    table_name TEXT;
BEGIN
    -- Create partitions for next 3 months
    FOREACH table_name IN ARRAY tables_to_partition
    LOOP
        FOR i IN 0..2 LOOP
            future_date := current_date + (i || ' months')::INTERVAL;
            PERFORM create_monthly_partition(table_name, future_date);
        END LOOP;
    END LOOP;
    
    -- Drop old partitions (keep 12 months)
    FOREACH table_name IN ARRAY tables_to_partition
    LOOP
        PERFORM drop_old_partitions(table_name, 12);
    END LOOP;
    
    -- Update table statistics
    ANALYZE;
END;
$$ LANGUAGE plpgsql;

-- Schedule maintenance (requires pg_cron)
-- SELECT cron.schedule('partition-maintenance', '0 0 1 * *', 'SELECT maintain_partitions()');

-- Manual test
SELECT maintain_partitions();

-- Verify partitions
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE tablename LIKE '%_2024_%'
ORDER BY tablename;

COMMIT;
