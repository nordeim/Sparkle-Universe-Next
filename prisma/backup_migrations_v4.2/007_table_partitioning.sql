-- migrations/007_table_partitioning.sql
-- Table partitioning for performance

-- 1. Partition analytics_events by month
-- Create parent table
CREATE TABLE analytics_events_partitioned (
    LIKE analytics_events INCLUDING ALL
) PARTITION BY RANGE (timestamp);

-- Create partitions for current and next 3 months
CREATE TABLE analytics_events_2024_01 PARTITION OF analytics_events_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE analytics_events_2024_02 PARTITION OF analytics_events_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Function to automatically create monthly partitions
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
    
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I PARTITION OF %I 
         FOR VALUES FROM (%L) TO (%L)',
        partition_name,
        table_name || '_partitioned',
        start_date_str,
        end_date_str
    );
END;
$$ LANGUAGE plpgsql;

-- 2. Partition activity_streams by month
CREATE TABLE activity_streams_partitioned (
    LIKE activity_streams INCLUDING ALL
) PARTITION BY RANGE (createdAt);

-- 3. Partition audit_logs by action type
CREATE TABLE audit_logs_partitioned (
    LIKE audit_logs INCLUDING ALL
) PARTITION BY LIST (action);

CREATE TABLE audit_logs_auth PARTITION OF audit_logs_partitioned
    FOR VALUES IN ('LOGIN', 'LOGOUT', 'PERMISSION_CHANGE');

CREATE TABLE audit_logs_crud PARTITION OF audit_logs_partitioned
    FOR VALUES IN ('CREATE', 'UPDATE', 'DELETE');

CREATE TABLE audit_logs_system PARTITION OF audit_logs_partitioned
    FOR VALUES IN ('MODERATION_ACTION', 'SYSTEM_ACTION');

-- Maintenance function to create future partitions
CREATE OR REPLACE FUNCTION maintain_partitions()
RETURNS void AS $$
DECLARE
    current_date DATE := CURRENT_DATE;
    future_date DATE;
BEGIN
    -- Create partitions for next 3 months
    FOR i IN 0..2 LOOP
        future_date := current_date + (i || ' months')::INTERVAL;
        
        PERFORM create_monthly_partition('analytics_events', future_date);
        PERFORM create_monthly_partition('activity_streams', future_date);
    END LOOP;
    
    -- Drop old partitions (older than 12 months)
    -- Implementation depends on retention policy
END;
$$ LANGUAGE plpgsql;

-- Schedule maintenance (using pg_cron if available)
-- SELECT cron.schedule('partition-maintenance', '0 0 1 * *', 'SELECT maintain_partitions()');
