-- migrations/008_advanced_indexes.sql
-- Advanced indexing strategies for Sparkle Universe v4.3
-- FIXED: Removed transaction wrapper for CONCURRENTLY operations
-- MERGED: Combined original features with additional optimizations

-- =====================================================
-- EXECUTION INSTRUCTIONS
-- =====================================================
-- This file contains two parts:
-- Part 1: CREATE INDEX CONCURRENTLY statements (run without transaction)
-- Part 2: Views and functions (run in transaction)
--
-- Option 1: Run entire file with psql (it will handle appropriately)
-- Option 2: Split into two files and run separately
-- Option 3: Use the provided execution script
-- =====================================================

-- =====================================================
-- PART 1: CONCURRENT INDEX CREATION (NO TRANSACTION)
-- =====================================================

-- =====================================================
-- PARTIAL INDEXES FOR FILTERED QUERIES
-- =====================================================

-- Index only active users for common user queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active_partial 
ON users ("lastSeenAt" DESC) 
WHERE deleted = false AND status = 'ACTIVE';

-- Index only published posts for feed queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_published_partial 
ON posts ("publishedAt" DESC) 
WHERE published = true AND deleted = false;

-- Index only unread notifications for user notification queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_unread_partial 
ON notifications ("userId", "createdAt" DESC) 
WHERE read = false;

-- Index active conversations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_active_partial
ON conversations ("lastMessageAt" DESC)
WHERE deleted = false AND "isArchived" = false;

-- Index pending moderation items
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_moderation_partial
ON posts ("createdAt" DESC)
WHERE "moderationStatus" = 'PENDING' AND deleted = false;

-- =====================================================
-- COVERING INDEXES FOR COMMON QUERIES
-- =====================================================

-- User profile query covering index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_profile_covering 
ON users (id) 
INCLUDE (username, image, bio, verified, level);

-- Post listing covering index for feed queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_listing_covering 
ON posts ("publishedAt" DESC) 
INCLUDE (title, slug, excerpt, "coverImage", "authorId", "categoryId")
WHERE published = true AND deleted = false;

-- Notification display covering index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_display_covering
ON notifications ("userId", "createdAt" DESC)
INCLUDE (type, title, message, "imageUrl", read, priority)
WHERE dismissed = false;

-- User stats covering index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_stats_covering
ON user_stats ("userId")
INCLUDE ("totalFollowers", "totalPosts", "engagementRate");

-- =====================================================
-- EXPRESSION INDEXES
-- =====================================================

-- Case-insensitive username search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_username_lower 
ON users (LOWER(username));

-- Case-insensitive email search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_lower
ON users (LOWER(email));

-- Date-based indexes for time queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_published_date 
ON posts (DATE("publishedAt")) 
WHERE published = true;

-- Hour extraction for analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_streams_hour
ON activity_streams (EXTRACT(HOUR FROM "createdAt"));

-- Month extraction for reporting
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_published_month
ON posts (DATE_TRUNC('month', "publishedAt"))
WHERE published = true AND deleted = false;

-- =====================================================
-- ARRAY INDEXES USING GIN
-- =====================================================

-- Post tags/keywords
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_tags_gin 
ON posts USING GIN ("metaKeywords");

-- User interests
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_interests_gin 
ON profiles USING GIN (interests);

-- User skills
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_skills_gin
ON profiles USING GIN (skills);

-- Group tags
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_tags_gin
ON groups USING GIN (tags);

-- Event categories
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_categories_gin
ON events USING GIN (categories);

-- =====================================================
-- COMPOSITE INDEXES FOR COMPLEX FILTERS
-- =====================================================

-- Posts complex filter for category pages
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_complex_filter 
ON posts ("categoryId", "contentType", "moderationStatus", "publishedAt" DESC)
WHERE published = true AND deleted = false;

-- User discovery index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_discovery
ON users (role, verified, level DESC, "createdAt" DESC)
WHERE deleted = false AND status = 'ACTIVE';

-- Group discovery index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_groups_discovery
ON groups (visibility, "isFeatured" DESC, "memberCount" DESC)
WHERE deleted = false;

-- Event discovery index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_discovery
ON events (status, "startTime", "isPublic")
WHERE deleted = false;

-- =====================================================
-- V4.3 SCHEMA COMPOSITE INDEXES (NEW IN UPDATE)
-- =====================================================

-- Scheduled publishing queue (from v4.3 migration notes)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_scheduled_publish 
ON posts ("scheduledPublishAt", "contentStatus")
WHERE "scheduledPublishAt" IS NOT NULL 
  AND "contentStatus" = 'SCHEDULED' 
  AND deleted = false;

-- Message delivery queue for status processing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_delivery_queue
ON messages ("conversationId", status, "createdAt")
WHERE status IN ('SENT', 'DELIVERED') 
  AND deleted = false;

-- Creator earnings tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_creator_earnings
ON users (role, "totalRevenueEarned" DESC)
WHERE role IN ('CREATOR', 'VERIFIED_CREATOR') 
  AND deleted = false;

-- Achievement progress tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_achievements_progress
ON user_achievements ("userId", progress)
WHERE progress < 1.0 
  AND deleted = false;

-- Active watch parties
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_watch_parties_active
ON watch_parties ("scheduledStart", "isPublic", "currentParticipants")
WHERE deleted = false 
  AND ("scheduledStart" > NOW() OR "actualStart" IS NOT NULL AND "endedAt" IS NULL);

-- =====================================================
-- INDEXES FOR JOIN OPERATIONS
-- =====================================================

-- Reactions join optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reactions_join 
ON reactions ("postId", type, "userId");

-- Comments thread navigation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_thread 
ON comments ("postId", "parentId", "createdAt")
WHERE deleted = false;

-- Follow relationship queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_follows_relationship
ON follows ("followerId", "followingId");

-- Group member queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_members_active
ON group_members ("groupId", role, "lastActiveAt" DESC)
WHERE "bannedUntil" IS NULL;

-- Message read tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_reads_tracking
ON message_reads ("userId", "messageId");

-- =====================================================
-- SPECIALIZED PERFORMANCE INDEXES
-- =====================================================

-- Hot content identification
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_hot_content
ON posts ("publishedAt" DESC, views DESC)
WHERE published = true 
  AND deleted = false 
  AND "publishedAt" > NOW() - INTERVAL '7 days';

-- User activity tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_activity_tracking
ON users ("lastSeenAt" DESC) 
WHERE deleted = false 
  AND "onlineStatus" = true;

-- Trending hashtags
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tags_trending
ON tags ("postCount" DESC, "createdAt" DESC)
WHERE deleted = false 
  AND featured = false;

-- =====================================================
-- ADDITIONAL OPTIMIZED INDEXES (FROM MERGE)
-- =====================================================

-- Active users index (simplified version)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active 
ON users (id) 
WHERE deleted = false;

-- Active posts index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_active 
ON posts (id) 
WHERE deleted = false AND published = true;

-- Active comments index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_active 
ON comments (id) 
WHERE deleted = false;

-- User feed covering index with included columns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_feed 
ON posts ("authorId", "publishedAt" DESC) 
INCLUDE (title, excerpt, "coverImage", views)
WHERE published = true AND deleted = false;

-- Leaderboard index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_stats_leaderboard 
ON user_stats ("totalFollowers" DESC, "engagementRate" DESC) 
INCLUDE ("userId", "totalPosts");

-- User creation by month for analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_month 
ON users (DATE_TRUNC('month', "createdAt"));

-- Complex notification query index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_unread 
ON notifications ("userId", read, "createdAt" DESC) 
WHERE dismissed = false;

-- Recent messages in conversations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation_recent 
ON messages ("conversationId", "createdAt" DESC) 
WHERE deleted = false;

-- =====================================================
-- BRIN INDEXES FOR TIME-SERIES DATA
-- =====================================================
-- Note: BRIN indexes don't support CONCURRENTLY, but they're very fast to create

-- Analytics events time-series index
CREATE INDEX IF NOT EXISTS idx_analytics_event_timestamp_brin 
ON analytics_events USING BRIN (timestamp);

-- Activity stream time-series index
CREATE INDEX IF NOT EXISTS idx_activity_stream_created_brin 
ON activity_streams USING BRIN ("createdAt");

-- View history time-series index
CREATE INDEX IF NOT EXISTS idx_view_history_created_brin 
ON view_history USING BRIN ("createdAt");

-- Login history time-series index
CREATE INDEX IF NOT EXISTS idx_login_history_created_brin 
ON login_history USING BRIN ("createdAt");

-- =====================================================
-- HASH INDEXES FOR EXACT MATCHES (PostgreSQL 10+)
-- =====================================================

-- Email exact match (hash index is faster for equality)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_hash 
ON users USING HASH (email);

-- Session token exact match
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_token_hash 
ON sessions USING HASH ("sessionToken");

-- API key exact match
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_keys_key_hash 
ON api_keys USING HASH (key);

-- Referral code exact match
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_referrals_code_hash 
ON referrals USING HASH ("referralCode");

-- =====================================================
-- PART 2: VIEWS AND FUNCTIONS (TRANSACTIONAL)
-- =====================================================
-- This part should be run in a transaction

-- Start transaction for views and functions
BEGIN;

-- =====================================================
-- INDEX USAGE ANALYSIS
-- =====================================================

-- Drop existing view if exists to recreate
DROP VIEW IF EXISTS index_usage_stats CASCADE;

-- Create comprehensive index usage view
CREATE VIEW index_usage_stats AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    CASE 
        WHEN idx_scan = 0 THEN 'UNUSED'
        WHEN idx_scan < 100 THEN 'RARELY USED'
        WHEN idx_scan < 1000 THEN 'OCCASIONALLY USED'
        ELSE 'FREQUENTLY USED'
    END as usage_category
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Function to identify unused indexes
CREATE OR REPLACE FUNCTION find_unused_indexes()
RETURNS TABLE (
    schemaname TEXT,
    tablename TEXT,
    indexname TEXT,
    index_size TEXT,
    index_scans BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.schemaname::TEXT,
        s.tablename::TEXT,
        s.indexname::TEXT,
        pg_size_pretty(pg_relation_size(s.indexrelid))::TEXT,
        s.idx_scan
    FROM pg_stat_user_indexes s
    JOIN pg_index i ON s.indexrelid = i.indexrelid
    WHERE s.idx_scan < 100
        AND s.schemaname = 'public'
        AND NOT i.indisunique
        AND NOT i.indisprimary
        AND s.indexrelid::regclass::text NOT LIKE '%_pkey'
        AND s.indexrelid::regclass::text NOT LIKE '%_key'
    ORDER BY pg_relation_size(s.indexrelid) DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to analyze index effectiveness
CREATE OR REPLACE FUNCTION analyze_index_effectiveness()
RETURNS TABLE (
    tablename TEXT,
    total_indexes BIGINT,
    used_indexes BIGINT,
    unused_indexes BIGINT,
    total_index_size TEXT,
    table_size TEXT,
    index_ratio NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH index_stats AS (
        SELECT 
            s.tablename,
            COUNT(*) as total_indexes,
            COUNT(*) FILTER (WHERE s.idx_scan > 0) as used_indexes,
            COUNT(*) FILTER (WHERE s.idx_scan = 0) as unused_indexes,
            SUM(pg_relation_size(s.indexrelid)) as total_index_size,
            pg_relation_size(s.relid) as table_size
        FROM pg_stat_user_indexes s
        WHERE s.schemaname = 'public'
        GROUP BY s.tablename, s.relid
    )
    SELECT 
        i.tablename::TEXT,
        i.total_indexes,
        i.used_indexes,
        i.unused_indexes,
        pg_size_pretty(i.total_index_size)::TEXT,
        pg_size_pretty(i.table_size)::TEXT,
        ROUND((i.total_index_size::NUMERIC / NULLIF(i.table_size, 0)), 2) as index_ratio
    FROM index_stats i
    ORDER BY i.total_index_size DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to recommend index maintenance
CREATE OR REPLACE FUNCTION recommend_index_maintenance()
RETURNS TABLE (
    recommendation TEXT,
    details TEXT
) AS $$
BEGIN
    -- Check for unused indexes
    IF EXISTS (SELECT 1 FROM find_unused_indexes() LIMIT 1) THEN
        RETURN QUERY 
        SELECT 
            'DROP UNUSED INDEXES'::TEXT,
            'Found indexes with < 100 scans. Run SELECT * FROM find_unused_indexes() for details'::TEXT;
    END IF;
    
    -- Check for high index ratio
    IF EXISTS (
        SELECT 1 FROM analyze_index_effectiveness() 
        WHERE index_ratio > 1.0 LIMIT 1
    ) THEN
        RETURN QUERY 
        SELECT 
            'HIGH INDEX OVERHEAD'::TEXT,
            'Some tables have more index size than data. Review with SELECT * FROM analyze_index_effectiveness()'::TEXT;
    END IF;
    
    -- Check for missing indexes on foreign keys
    RETURN QUERY
    WITH foreign_keys AS (
        SELECT
            tc.table_name,
            kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema = 'public'
    ),
    indexed_columns AS (
        SELECT
            t.relname as table_name,
            a.attname as column_name
        FROM pg_index i
        JOIN pg_class t ON t.oid = i.indrelid
        JOIN pg_attribute a ON a.attrelid = t.oid
        WHERE a.attnum = ANY(i.indkey)
            AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    )
    SELECT 
        'MISSING FK INDEX'::TEXT,
        'Table ' || fk.table_name || ' column ' || fk.column_name || ' has FK but no index'::TEXT
    FROM foreign_keys fk
    LEFT JOIN indexed_columns ic 
        ON fk.table_name = ic.table_name 
        AND fk.column_name = ic.column_name
    WHERE ic.column_name IS NULL
    LIMIT 5;
    
    -- If no issues found
    IF NOT FOUND THEN
        RETURN QUERY 
        SELECT 
            'ALL GOOD'::TEXT,
            'No immediate index maintenance recommendations'::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions on views and functions
GRANT SELECT ON index_usage_stats TO PUBLIC;
GRANT EXECUTE ON FUNCTION find_unused_indexes() TO PUBLIC;
GRANT EXECUTE ON FUNCTION analyze_index_effectiveness() TO PUBLIC;
GRANT EXECUTE ON FUNCTION recommend_index_maintenance() TO PUBLIC;

COMMIT;

-- =====================================================
-- POST-DEPLOYMENT OPERATIONS
-- =====================================================

-- Analyze all tables to update statistics
-- This helps the query planner make better decisions with new indexes
ANALYZE;

-- =====================================================
-- VERIFICATION QUERIES (Run after deployment)
-- =====================================================

-- Check index creation success
/*
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(schemaname||'.'||indexname)) as size
FROM pg_indexes 
WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%'
ORDER BY pg_relation_size(schemaname||'.'||indexname) DESC
LIMIT 20;
*/

-- Check for any invalid indexes
/*
SELECT 
    n.nspname as schema_name,
    c.relname as index_name,
    c.relkind as type
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'i'
    AND NOT pg_index.indisvalid
    AND n.nspname = 'public';
*/

-- Monitor index usage after 24 hours
/*
SELECT * FROM index_usage_stats 
WHERE usage_category IN ('UNUSED', 'RARELY USED')
ORDER BY index_size DESC;
*/

-- Get maintenance recommendations
/*
SELECT * FROM recommend_index_maintenance();
*/
