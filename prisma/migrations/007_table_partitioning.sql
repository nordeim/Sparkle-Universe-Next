-- migrations/007_table_partitioning.sql
-- Table partitioning for performance optimization
-- FIXED: Column name case sensitivity, foreign key handling, safe migration

-- =====================================================
-- IMPORTANT: Pre-Migration Checklist
-- =====================================================
-- 1. BACKUP your database before running
-- 2. Run during low-traffic period
-- 3. Have rollback plan ready
-- 4. Monitor foreign key constraints

BEGIN;

-- =====================================================
-- HELPER FUNCTION FOR SAFE TABLE MIGRATION
-- =====================================================

CREATE OR REPLACE FUNCTION safe_partition_migration(
    source_table TEXT,
    partition_column TEXT,
    partition_type TEXT  -- 'RANGE' or 'HASH'
) RETURNS BOOLEAN AS $$
DECLARE
    has_foreign_keys BOOLEAN;
    constraint_count INT;
BEGIN
    -- Check for foreign key constraints
    SELECT COUNT(*) > 0 INTO has_foreign_keys
    FROM information_schema.table_constraints
    WHERE table_name = source_table
      AND constraint_type = 'FOREIGN KEY';
    
    IF has_foreign_keys THEN
        RAISE NOTICE 'Table % has foreign key constraints. Manual intervention required.', source_table;
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ANALYTICS EVENTS PARTITIONING (BY MONTH)
-- =====================================================

-- Check if safe to partition
DO $$
BEGIN
    IF NOT safe_partition_migration('analytics_events', 'timestamp', 'RANGE') THEN
        RAISE NOTICE 'Skipping analytics_events partitioning due to constraints';
    ELSE
        -- Rename existing table
        ALTER TABLE analytics_events RENAME TO analytics_events_old;
        
        -- Create partitioned table with explicit column definitions
        CREATE TABLE analytics_events (
            id TEXT NOT NULL,
            "eventName" TEXT NOT NULL,
            "eventType" TEXT NOT NULL,
            "userId" TEXT,
            "sessionId" TEXT,
            properties JSONB,
            context JSONB,
            timestamp TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id, timestamp)  -- Include partition key in PK
        ) PARTITION BY RANGE (timestamp);
        
        -- Create indexes
        CREATE INDEX idx_analytics_events_name_timestamp ON analytics_events ("eventName", timestamp DESC);
        CREATE INDEX idx_analytics_events_user ON analytics_events ("userId") WHERE "userId" IS NOT NULL;
        CREATE INDEX idx_analytics_events_session ON analytics_events ("sessionId") WHERE "sessionId" IS NOT NULL;
        CREATE INDEX idx_analytics_events_timestamp ON analytics_events (timestamp);
        
        -- Create initial partitions
        CREATE TABLE analytics_events_2024_01 PARTITION OF analytics_events
            FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
        
        CREATE TABLE analytics_events_2024_02 PARTITION OF analytics_events
            FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
        
        CREATE TABLE analytics_events_2024_03 PARTITION OF analytics_events
            FOR VALUES FROM ('2024-03-01') TO ('2024-04-01');
        
        CREATE TABLE analytics_events_2024_04 PARTITION OF analytics_events
            FOR VALUES FROM ('2024-04-01') TO ('2024-05-01');
        
        -- Create future partitions
        CREATE TABLE analytics_events_2024_05 PARTITION OF analytics_events
            FOR VALUES FROM ('2024-05-01') TO ('2024-06-01');
        
        CREATE TABLE analytics_events_2024_06 PARTITION OF analytics_events
            FOR VALUES FROM ('2024-06-01') TO ('2024-07-01');
        
        -- Migrate data with explicit column mapping
        INSERT INTO analytics_events (
            id, "eventName", "eventType", "userId", "sessionId", 
            properties, context, timestamp
        )
        SELECT 
            id, "eventName", "eventType", "userId", "sessionId", 
            properties, context, timestamp
        FROM analytics_events_old;
        
        -- Drop old table
        DROP TABLE analytics_events_old;
        
        RAISE NOTICE 'Successfully partitioned analytics_events table';
    END IF;
END $$;

-- =====================================================
-- ACTIVITY STREAMS PARTITIONING (BY MONTH)
-- =====================================================

DO $$
BEGIN
    -- Check if table exists and can be partitioned
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_streams') THEN
        -- Rename existing table
        ALTER TABLE activity_streams RENAME TO activity_streams_old;
        
        -- Create partitioned table with proper column names
        CREATE TABLE activity_streams (
            id TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            action TEXT NOT NULL,
            "entityType" TEXT NOT NULL,
            "entityId" TEXT NOT NULL,
            "entityData" JSONB,
            metadata JSONB,
            visibility TEXT NOT NULL DEFAULT 'PUBLIC',
            "ipAddress" TEXT,
            "userAgent" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id, "createdAt")  -- Include partition key
        ) PARTITION BY RANGE ("createdAt");
        
        -- Create indexes
        CREATE INDEX idx_activity_streams_user_created ON activity_streams ("userId", "createdAt" DESC);
        CREATE INDEX idx_activity_streams_entity ON activity_streams ("entityType", "entityId");
        CREATE INDEX idx_activity_streams_action ON activity_streams (action);
        CREATE INDEX idx_activity_streams_visibility_created ON activity_streams (visibility, "createdAt" DESC);
        
        -- Create partitions
        CREATE TABLE activity_streams_2024_01 PARTITION OF activity_streams
            FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
        
        CREATE TABLE activity_streams_2024_02 PARTITION OF activity_streams
            FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
        
        CREATE TABLE activity_streams_2024_03 PARTITION OF activity_streams
            FOR VALUES FROM ('2024-03-01') TO ('2024-04-01');
        
        CREATE TABLE activity_streams_2024_04 PARTITION OF activity_streams
            FOR VALUES FROM ('2024-04-01') TO ('2024-05-01');
        
        -- Migrate data
        INSERT INTO activity_streams 
        SELECT * FROM activity_streams_old;
        
        -- Drop old table
        DROP TABLE activity_streams_old;
        
        RAISE NOTICE 'Successfully partitioned activity_streams table';
    END IF;
END $$;

-- =====================================================
-- NOTIFICATIONS PARTITIONING (BY USER HASH)
-- =====================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        -- Rename existing table
        ALTER TABLE notifications RENAME TO notifications_old;
        
        -- Create partitioned table
        CREATE TABLE notifications (
            id TEXT NOT NULL,
            type TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "actorId" TEXT,
            "entityId" TEXT,
            "entityType" TEXT,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            data JSONB,
            "imageUrl" TEXT,
            "actionUrl" TEXT,
            priority INTEGER NOT NULL DEFAULT 0,
            read BOOLEAN NOT NULL DEFAULT false,
            "readAt" TIMESTAMP(3),
            clicked BOOLEAN NOT NULL DEFAULT false,
            "clickedAt" TIMESTAMP(3),
            "emailSent" BOOLEAN NOT NULL DEFAULT false,
            "pushSent" BOOLEAN NOT NULL DEFAULT false,
            "smsSent" BOOLEAN NOT NULL DEFAULT false,
            dismissed BOOLEAN NOT NULL DEFAULT false,
            "dismissedAt" TIMESTAMP(3),
            "expiresAt" TIMESTAMP(3),
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id, "userId")  -- Include partition key
        ) PARTITION BY HASH ("userId");
        
        -- Create indexes
        CREATE INDEX idx_notifications_user_read_created ON notifications ("userId", read, "createdAt" DESC);
        CREATE INDEX idx_notifications_actor ON notifications ("actorId") WHERE "actorId" IS NOT NULL;
        CREATE INDEX idx_notifications_type ON notifications (type);
        CREATE INDEX idx_notifications_priority ON notifications (priority);
        CREATE INDEX idx_notifications_expires ON notifications ("expiresAt") WHERE "expiresAt" IS NOT NULL;
        
        -- Create 8 hash partitions for even distribution
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
        
        -- Drop old table
        DROP TABLE notifications_old;
        
        RAISE NOTICE 'Successfully partitioned notifications table';
    END IF;
END $$;

-- =====================================================
-- XP LOGS PARTITIONING (BY MONTH)
-- =====================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'xp_logs') THEN
        -- Rename existing table
        ALTER TABLE xp_logs RENAME TO xp_logs_old;
        
        -- Create partitioned table
        CREATE TABLE xp_logs (
            id TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            amount INTEGER NOT NULL,
            source TEXT NOT NULL,
            "sourceId" TEXT,
            reason TEXT,
            multiplier DOUBLE PRECISION NOT NULL DEFAULT 1,
            "bonusXp" INTEGER NOT NULL DEFAULT 0,
            "totalXp" INTEGER NOT NULL,
            metadata JSONB,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id, "createdAt")
        ) PARTITION BY RANGE ("createdAt");
        
        -- Create indexes
        CREATE INDEX idx_xp_logs_user_created ON xp_logs ("userId", "createdAt" DESC);
        CREATE INDEX idx_xp_logs_source ON xp_logs (source);
        
        -- Create partitions
        CREATE TABLE xp_logs_2024_01 PARTITION OF xp_logs
            FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
        CREATE TABLE xp_logs_2024_02 PARTITION OF xp_logs
            FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
        CREATE TABLE xp_logs_2024_03 PARTITION OF xp_logs
            FOR VALUES FROM ('2024-03-01') TO ('2024-04-01');
        CREATE TABLE xp_logs_2024_04 PARTITION OF xp_logs
            FOR VALUES FROM ('2024-04-01') TO ('2024-05-01');
        
        -- Migrate data
        INSERT INTO xp_logs SELECT * FROM xp_logs_old;
        
        -- Drop old table
        DROP TABLE xp_logs_old;
        
        RAISE NOTICE 'Successfully partitioned xp_logs table';
    END IF;
END $$;

-- =====================================================
-- PARTITION MAINTENANCE FUNCTIONS
-- =====================================================

-- Function to create monthly partitions dynamically
CREATE OR REPLACE FUNCTION create_monthly_partition(
    table_name TEXT,
    start_date DATE
)
RETURNS void AS $$
DECLARE
    partition_name TEXT;
    start_date_str TEXT;
    end_date_str TEXT;
    partition_column TEXT;
BEGIN
    -- Determine partition column based on table
    CASE table_name
        WHEN 'analytics_events' THEN partition_column := 'timestamp';
        WHEN 'activity_streams' THEN partition_column := '"createdAt"';
        WHEN 'xp_logs' THEN partition_column := '"createdAt"';
        WHEN 'currency_transactions' THEN partition_column := '"createdAt"';
        ELSE partition_column := '"createdAt"';
    END CASE;
    
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
        -- Extract date from partition name and check if it's old enough
        IF right(partition.tablename, 7) ~ '^\d{4}_\d{2}$' THEN
            IF to_date(right(partition.tablename, 7), 'YYYY_MM') < cutoff_date THEN
                EXECUTE format('DROP TABLE IF EXISTS %I.%I', partition.schemaname, partition.tablename);
                RAISE NOTICE 'Dropped old partition %.%', partition.schemaname, partition.tablename;
            END IF;
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
        'xp_logs'
    ];
    table_name TEXT;
BEGIN
    -- Create partitions for next 3 months
    FOREACH table_name IN ARRAY tables_to_partition
    LOOP
        -- Check if table exists before trying to partition
        IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = table_name) THEN
            FOR i IN 0..2 LOOP
                future_date := current_date + (i || ' months')::INTERVAL;
                PERFORM create_monthly_partition(table_name, future_date);
            END LOOP;
        END IF;
    END LOOP;
    
    -- Drop old partitions (keep 12 months)
    FOREACH table_name IN ARRAY tables_to_partition
    LOOP
        PERFORM drop_old_partitions(table_name, 12);
    END LOOP;
    
    -- Update table statistics
    ANALYZE;
    
    RAISE NOTICE 'Partition maintenance completed';
END;
$$ LANGUAGE plpgsql;

-- Test the maintenance function
SELECT maintain_partitions();

-- Verify partitions created
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE tablename LIKE '%_2024_%'
ORDER BY tablename;

COMMIT;

-- =====================================================
-- POST-MIGRATION VERIFICATION
-- =====================================================

-- Verify partition structure
SELECT 
    parent.relname AS parent_table,
    child.relname AS partition_name,
    pg_get_expr(child.relpartbound, child.oid) AS partition_constraint
FROM pg_inherits
JOIN pg_class parent ON pg_inherits.inhparent = parent.oid
JOIN pg_class child ON pg_inherits.inhrelid = child.oid
WHERE parent.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY parent.relname, child.relname;

-- Check partition sizes
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    (SELECT COUNT(*) FROM pg_class WHERE relname = tablename) as exists
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename ~ '_\d{4}_\d{2}$'
ORDER BY tablename;
