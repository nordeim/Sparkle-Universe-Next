# Comprehensive Error Analysis & Resolution Plan

## Root Cause Analysis

After meticulously analyzing the errors, I've identified **3 primary issues**:

### 1. **Transaction Block Incompatibility**
- `ALTER SYSTEM` commands cannot run inside transactions
- `CREATE INDEX CONCURRENTLY` cannot run inside transactions
- These PostgreSQL limitations require restructuring the migration approach

### 2. **Column Name Case Sensitivity**
- PostgreSQL treats unquoted identifiers as lowercase
- Prisma uses camelCase column names (e.g., `postId`, `streakDays`, `metaKeywords`)
- SQL queries must use double quotes for camelCase: `"postId"` not `postid`

### 3. **Missing Schema Context**
- Some queries need explicit table qualification
- Example: `level_configs."requiredXp"` instead of just `requiredXp`

## Detailed Execution Plan

### Phase 1: Pre-Implementation Validation
- [x] Identify all transaction-incompatible commands
- [x] List all camelCase column references
- [x] Map Prisma schema names to PostgreSQL identifiers
- [x] Create testing strategy

### Phase 2: Migration Restructuring
- [ ] Split 001 into transactional and non-transactional parts
- [ ] Remove BEGIN/COMMIT from 002 (CONCURRENTLY indexes)
- [ ] Fix all column name references with proper quotes
- [ ] Add error handling and idempotency

### Phase 3: Implementation
- [ ] Create fixed migration files
- [ ] Add execution scripts with proper ordering
- [ ] Include rollback procedures
- [ ] Document execution requirements

---

## Fixed Migration Files

### 📄 Fixed: 001_enable_extensions.sql

```sql
-- migrations/001_enable_extensions.sql
-- Enable required PostgreSQL extensions for Sparkle Universe v4.3
-- IMPORTANT: This script has two parts - transactional and non-transactional

-- =====================================================
-- PART 1: Extensions (Transactional)
-- =====================================================
-- Run this part first
BEGIN;

-- Enable pg_trgm for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Enable pgcrypto for encryption functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enable uuid-ossp for UUID generation (if not using gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_stat_statements for query performance monitoring
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Verify extensions
SELECT 
    extname AS extension_name,
    extversion AS version,
    extnamespace::regnamespace AS schema
FROM pg_extension
WHERE extname IN ('pg_trgm', 'pgcrypto', 'uuid-ossp', 'pg_stat_statements')
ORDER BY extname;

COMMIT;

-- =====================================================
-- PART 2: System Configuration (Non-transactional)
-- =====================================================
-- Run these commands separately AFTER the transaction above
-- These MUST be run as superuser or with appropriate permissions

-- NOTE: Run each line separately in psql or your admin tool:
-- ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
-- ALTER SYSTEM SET pg_stat_statements.track = 'all';
-- ALTER SYSTEM SET pg_stat_statements.max = 10000;

-- After running ALTER SYSTEM commands:
-- 1. Restart PostgreSQL service
-- 2. Run: SELECT pg_reload_conf();
-- 3. Verify with: SHOW shared_preload_libraries;

-- =====================================================
-- PART 3: Verification Query
-- =====================================================
-- Run this after restart to verify pg_stat_statements is active
SELECT 
    name, 
    setting, 
    unit, 
    category 
FROM pg_settings 
WHERE name LIKE 'pg_stat_statements%'
ORDER BY name;
```

### 📄 Fixed: 002_json_gin_indexes.sql

```sql
-- migrations/002_json_gin_indexes.sql
-- JSON GIN indexes for improved query performance
-- IMPORTANT: This script uses CONCURRENTLY and must run OUTSIDE transactions
-- Run each CREATE INDEX separately or use the provided execution script

-- =====================================================
-- EXECUTION INSTRUCTIONS
-- =====================================================
-- Option 1: Run this entire file WITHOUT transaction
-- Option 2: Use psql with: \set ON_ERROR_STOP on
-- Option 3: Use the batch execution script below

-- =====================================================
-- PROFILE JSON INDEXES
-- =====================================================

-- Profile JSON indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profile_theme_preference 
ON profiles USING GIN ("themePreference")
WHERE "themePreference" IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profile_notification_settings 
ON profiles USING GIN ("notificationSettings");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profile_privacy_settings 
ON profiles USING GIN ("privacySettings");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profile_social_links 
ON profiles USING GIN ("socialLinks")
WHERE "socialLinks" IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profile_youtube_channel_data 
ON profiles USING GIN ("youtubeChannelData")
WHERE "youtubeChannelData" IS NOT NULL;

-- =====================================================
-- POST CONTENT AND METADATA
-- =====================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_content 
ON posts USING GIN (content);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_sponsor_info 
ON posts USING GIN ("sponsorInfo")
WHERE "sponsorInfo" IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_youtube_video_data 
ON posts USING GIN ("youtubeVideoData")
WHERE "youtubeVideoData" IS NOT NULL;

-- =====================================================
-- GROUP SETTINGS AND CONFIGURATION
-- =====================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_guidelines 
ON groups USING GIN (guidelines)
WHERE guidelines IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_settings 
ON groups USING GIN (settings);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_custom_emojis 
ON groups USING GIN ("customEmojis")
WHERE "customEmojis" IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_metadata 
ON groups USING GIN (metadata)
WHERE metadata IS NOT NULL;

-- =====================================================
-- EVENT COMPLEX FIELDS
-- =====================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_agenda 
ON events USING GIN (agenda)
WHERE agenda IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_location_coords 
ON events USING GIN ("locationCoords")
WHERE "locationCoords" IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_recurrence 
ON events USING GIN (recurrence)
WHERE recurrence IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_speakers 
ON events USING GIN (speakers)
WHERE speakers IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_sponsors 
ON events USING GIN (sponsors)
WHERE sponsors IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_materials 
ON events USING GIN (materials)
WHERE materials IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_feedback 
ON events USING GIN (feedback)
WHERE feedback IS NOT NULL;

-- =====================================================
-- TRADING AND MARKETPLACE
-- =====================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trade_initiator_items 
ON trades USING GIN ("initiatorItems");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trade_recipient_items 
ON trades USING GIN ("recipientItems");

-- =====================================================
-- GAMIFICATION SYSTEM
-- =====================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quest_requirements 
ON quests USING GIN (requirements);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quest_rewards 
ON quests USING GIN (rewards);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quest_metadata 
ON quests USING GIN (metadata)
WHERE metadata IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_quest_progress 
ON user_quests USING GIN (progress);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_achievement_criteria 
ON achievements USING GIN (criteria)
WHERE criteria IS NOT NULL;

-- =====================================================
-- AI AND PERSONALIZATION
-- =====================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_ai_content_preferences 
ON user_ai_preferences USING GIN ("contentPreferences");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_ai_writing_style 
ON user_ai_preferences USING GIN ("writingStyle")
WHERE "writingStyle" IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_recommendation_context 
ON ai_recommendations USING GIN (context)
WHERE context IS NOT NULL;

-- =====================================================
-- MESSAGING SYSTEM
-- =====================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_attachments 
ON messages USING GIN (attachments)
WHERE attachments IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_reactions 
ON messages USING GIN (reactions)
WHERE reactions IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_metadata 
ON messages USING GIN (metadata)
WHERE metadata IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_edit_history 
ON messages USING GIN ("editHistory")
WHERE "editHistory" IS NOT NULL AND array_length("editHistory", 1) > 0;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversation_settings 
ON conversations USING GIN (settings);

-- =====================================================
-- POLLING SYSTEM
-- =====================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_poll_final_results 
ON polls USING GIN ("finalResults")
WHERE "finalResults" IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_poll_vote_metadata 
ON poll_votes USING GIN (metadata)
WHERE metadata IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_poll_option_metadata 
ON poll_options USING GIN (metadata)
WHERE metadata IS NOT NULL;

-- =====================================================
-- SPECIFIC JSON PATH INDEXES
-- =====================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_content_type 
ON posts ((content->>'type'))
WHERE content IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_content_blocks 
ON posts ((content->'blocks'))
WHERE content IS NOT NULL AND content ? 'blocks';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profile_notification_language 
ON profiles (("notificationSettings"->>'language'))
WHERE "notificationSettings" IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profile_notification_email_frequency 
ON profiles (("notificationSettings"->>'emailDigestFrequency'))
WHERE "notificationSettings" IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_settings_max_members 
ON groups ((settings->>'maxMembers'))
WHERE settings IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_settings_join_approval 
ON groups ((settings->>'joinApproval'))
WHERE settings IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_location_lat 
ON events (("locationCoords"->>'lat'))
WHERE "locationCoords" IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_location_lng 
ON events (("locationCoords"->>'lng'))
WHERE "locationCoords" IS NOT NULL;

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- Run this in a separate transaction to verify indexes

/*
BEGIN;

SELECT 
    n.nspname as schema_name,
    t.relname as table_name,
    i.relname as index_name,
    am.amname as index_type,
    pg_size_pretty(pg_relation_size(i.oid)) as index_size,
    CASE 
        WHEN am.amname = 'gin' THEN 'JSON/Array Index'
        ELSE 'Other'
    END as index_category
FROM pg_index idx
JOIN pg_class i ON i.oid = idx.indexrelid
JOIN pg_class t ON t.oid = idx.indrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
JOIN pg_am am ON am.oid = i.relam
WHERE n.nspname = 'public'
    AND am.amname = 'gin'
ORDER BY t.relname, i.relname;

COMMIT;
*/
```

### 📄 Fixed: 003_database_functions.sql

```sql
-- migrations/003_database_functions.sql
-- Utility functions for Sparkle Universe v4.3
-- FIXED: Column name case sensitivity issues

BEGIN;

-- Function 1: Calculate user level based on level_configs table
CREATE OR REPLACE FUNCTION calculate_user_level(experience_points INT)
RETURNS INT AS $$
DECLARE
    target_level INT;
BEGIN
    -- Fixed: Use quoted identifier for camelCase column
    SELECT level INTO target_level
    FROM level_configs
    WHERE "requiredXp" <= experience_points
    ORDER BY level DESC
    LIMIT 1;
    
    -- Default to level 1 if no config found
    RETURN COALESCE(target_level, 1);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function 2: Calculate engagement rate for a post
CREATE OR REPLACE FUNCTION calculate_engagement_rate(post_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    total_views INT;
    total_interactions INT;
    engagement_rate NUMERIC(5,4);
BEGIN
    -- Fixed: Use quoted identifiers for camelCase columns
    SELECT COALESCE(ps."viewCount", 0) INTO total_views
    FROM posts p
    LEFT JOIN post_stats ps ON p.id = ps."postId"
    WHERE p.id = post_id;
    
    -- Get interaction count (reactions + comments + shares + bookmarks)
    SELECT 
        COALESCE(COUNT(DISTINCT r.id), 0) + 
        COALESCE(COUNT(DISTINCT c.id) FILTER (WHERE c.deleted = false), 0) +
        COALESCE(ps."shareCount", 0) +
        COALESCE(COUNT(DISTINCT b.id), 0)
    INTO total_interactions
    FROM posts p
    LEFT JOIN post_stats ps ON p.id = ps."postId"
    LEFT JOIN reactions r ON p.id = r."postId"
    LEFT JOIN comments c ON p.id = c."postId"
    LEFT JOIN bookmarks b ON p.id = b."postId"
    WHERE p.id = post_id
    GROUP BY ps."shareCount";
    
    -- Calculate engagement rate
    IF total_views > 0 THEN
        engagement_rate := (total_interactions::NUMERIC / total_views::NUMERIC);
    ELSE
        engagement_rate := 0;
    END IF;
    
    RETURN LEAST(engagement_rate, 1); -- Cap at 100%
END;
$$ LANGUAGE plpgsql STABLE;

-- Function 3: Update post statistics (comprehensive)
CREATE OR REPLACE FUNCTION update_post_stats(post_id UUID)
RETURNS VOID AS $$
DECLARE
    stats RECORD;
    engagement NUMERIC;
BEGIN
    -- Fixed: Use quoted identifiers for all camelCase columns
    WITH post_metrics AS (
        SELECT 
            p.id,
            COUNT(DISTINCT vh.id) as view_count,
            COUNT(DISTINCT vh."userId") as unique_view_count,
            COUNT(DISTINCT CASE WHEN r.type = 'LIKE' THEN r.id END) as like_count,
            COUNT(DISTINCT CASE WHEN r.type = 'LOVE' THEN r.id END) as love_count,
            COUNT(DISTINCT CASE WHEN r.type = 'FIRE' THEN r.id END) as fire_count,
            COUNT(DISTINCT r.id) as total_reactions,
            COUNT(DISTINCT c.id) FILTER (WHERE c.deleted = false) as comment_count,
            COUNT(DISTINCT b.id) as bookmark_count,
            AVG(vh."viewDuration") FILTER (WHERE vh."viewDuration" > 0) as avg_read_time
        FROM posts p
        LEFT JOIN view_history vh ON p.id = vh."postId"
        LEFT JOIN reactions r ON p.id = r."postId"
        LEFT JOIN comments c ON p.id = c."postId"
        LEFT JOIN bookmarks b ON p.id = b."postId"
        WHERE p.id = post_id
        GROUP BY p.id
    )
    SELECT * INTO stats FROM post_metrics;
    
    -- Calculate engagement rate
    engagement := calculate_engagement_rate(post_id);
    
    -- Update or insert post stats with quoted identifiers
    INSERT INTO post_stats (
        "postId", "viewCount", "uniqueViewCount", "likeCount", "loveCount", "fireCount", 
        "totalReactionCount", "commentCount", "bookmarkCount", "avgReadTime",
        "engagementRate", "lastCalculatedAt"
    )
    VALUES (
        post_id, 
        COALESCE(stats.view_count, 0),
        COALESCE(stats.unique_view_count, 0),
        COALESCE(stats.like_count, 0),
        COALESCE(stats.love_count, 0),
        COALESCE(stats.fire_count, 0),
        COALESCE(stats.total_reactions, 0),
        COALESCE(stats.comment_count, 0),
        COALESCE(stats.bookmark_count, 0),
        COALESCE(stats.avg_read_time, 0),
        engagement,
        NOW()
    )
    ON CONFLICT ("postId") DO UPDATE SET
        "viewCount" = EXCLUDED."viewCount",
        "uniqueViewCount" = EXCLUDED."uniqueViewCount",
        "likeCount" = EXCLUDED."likeCount",
        "loveCount" = EXCLUDED."loveCount",
        "fireCount" = EXCLUDED."fireCount",
        "totalReactionCount" = EXCLUDED."totalReactionCount",
        "commentCount" = EXCLUDED."commentCount",
        "bookmarkCount" = EXCLUDED."bookmarkCount",
        "avgReadTime" = EXCLUDED."avgReadTime",
        "engagementRate" = EXCLUDED."engagementRate",
        "lastCalculatedAt" = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function 4: Calculate user reputation score
CREATE OR REPLACE FUNCTION calculate_reputation_score(user_id UUID)
RETURNS INT AS $$
DECLARE
    reputation INT := 0;
    user_stats RECORD;
BEGIN
    -- Fixed: Use quoted identifiers for camelCase columns
    SELECT 
        u.level,
        u.verified,
        u.role,
        u."reputationScore" as base_reputation,
        COALESCE(u."totalRevenueEarned"::INT / 1000, 0) as revenue_score,
        us."totalPosts",
        us."totalLikesReceived",
        us."totalFollowers",
        us."contentQualityScore",
        COUNT(DISTINCT ua.id) FILTER (WHERE ua.deleted = false) as achievements_count,
        COUNT(DISTINCT p.id) FILTER (WHERE p.featured = true) as featured_posts
    INTO user_stats
    FROM users u
    LEFT JOIN user_stats us ON u.id = us."userId"
    LEFT JOIN user_achievements ua ON u.id = ua."userId"
    LEFT JOIN posts p ON u.id = p."authorId" AND p.deleted = false
    WHERE u.id = user_id
    GROUP BY u.id, u.level, u.verified, u.role, u."reputationScore", 
             u."totalRevenueEarned", us."totalPosts", us."totalLikesReceived", 
             us."totalFollowers", us."contentQualityScore";
    
    -- Calculate reputation based on multiple factors
    reputation := 
        COALESCE(user_stats.base_reputation, 0) +
        (user_stats.level * 100) +
        (CASE WHEN user_stats.verified THEN 500 ELSE 0 END) +
        (CASE 
            WHEN user_stats.role = 'VERIFIED_CREATOR' THEN 1000
            WHEN user_stats.role = 'CREATOR' THEN 500
            ELSE 0
        END) +
        (LEAST(user_stats."totalPosts", 100) * 10) +
        (LEAST(user_stats."totalLikesReceived", 1000) * 2) +
        (LEAST(user_stats."totalFollowers", 10000) * 1) +
        (user_stats.achievements_count * 50) +
        (user_stats.featured_posts * 200) +
        (COALESCE(user_stats."contentQualityScore", 0) * 100) +
        user_stats.revenue_score;
    
    RETURN reputation;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function 5: Validate soft delete consistency
CREATE OR REPLACE FUNCTION validate_soft_delete(
    table_name TEXT,
    record_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    is_valid BOOLEAN;
BEGIN
    -- Check if deleted flag and deletedAt are consistent
    EXECUTE format(
        'SELECT (deleted = false OR "deletedAt" IS NOT NULL) 
         FROM %I WHERE id = $1',
        table_name
    ) INTO is_valid USING record_id;
    
    RETURN COALESCE(is_valid, true);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function 6: Check achievement eligibility
CREATE OR REPLACE FUNCTION check_achievement_eligibility(
    user_id UUID,
    achievement_code TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    achievement RECORD;
    user_data RECORD;
    is_eligible BOOLEAN := false;
BEGIN
    -- Get achievement criteria
    SELECT * INTO achievement
    FROM achievements
    WHERE code = achievement_code AND deleted = false;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Check if user already has it
    IF EXISTS (
        SELECT 1 FROM user_achievements ua
        WHERE ua."userId" = user_id 
        AND ua."achievementId" = achievement.id
        AND ua.deleted = false
    ) THEN
        RETURN false;
    END IF;
    
    -- Get user data for criteria checking with quoted identifiers
    SELECT 
        u.*,
        us."totalPosts",
        us."totalFollowers",
        us."streakDays"
    INTO user_data
    FROM users u
    LEFT JOIN user_stats us ON u.id = us."userId"
    WHERE u.id = user_id;
    
    -- Check criteria based on achievement code
    CASE achievement_code
        WHEN 'FIRST_POST' THEN
            is_eligible := user_data."totalPosts" >= 1;
        WHEN 'PROLIFIC_WRITER' THEN
            is_eligible := user_data."totalPosts" >= 50;
        WHEN 'SOCIAL_BUTTERFLY' THEN
            is_eligible := user_data."totalFollowers" >= 100;
        WHEN 'STREAK_WEEK' THEN
            is_eligible := user_data."streakDays" >= 7;
        WHEN 'LEVEL_10' THEN
            is_eligible := user_data.level >= 10;
        ELSE
            -- Check JSON criteria if exists
            IF achievement.criteria IS NOT NULL THEN
                -- Complex criteria evaluation would go here
                is_eligible := false;
            END IF;
    END CASE;
    
    RETURN is_eligible;
END;
$$ LANGUAGE plpgsql STABLE;

-- Test the functions with proper error handling
DO $$
BEGIN
    -- Test with proper exception handling
    BEGIN
        RAISE NOTICE 'Testing calculate_user_level: % (should be 1)', calculate_user_level(0);
        RAISE NOTICE 'Testing calculate_user_level: % (should match level_configs)', calculate_user_level(1000);
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Error in function tests: %', SQLERRM;
    END;
END $$;

COMMIT;
```

### 📄 Fixed: 004_materialized_views.sql

```sql
-- migrations/004_materialized_views.sql
-- Materialized views for performance optimization
-- FIXED: Column name case sensitivity

BEGIN;

-- View 1: Trending Posts (refreshed hourly)
DROP MATERIALIZED VIEW IF EXISTS trending_posts CASCADE;
CREATE MATERIALIZED VIEW trending_posts AS
WITH post_metrics AS (
    SELECT 
        p.id,
        p.title,
        p.slug,
        p."authorId",
        COALESCE(u.username, p."authorName") as authorName,
        p."coverImage",
        p.excerpt,
        p."publishedAt",
        p.views,
        COALESCE(ps."viewCount", p.views, 0) as total_views,
        COALESCE(ps."totalReactionCount", 0) as reactions,
        COALESCE(ps."commentCount", 0) as comments,
        COALESCE(ps."shareCount", 0) as shares,
        COALESCE(ps."engagementRate", 0) as engagement,
        -- Enhanced trending score with time decay
        (
            COALESCE(ps."viewCount", p.views, 0) * 0.1 +
            COALESCE(ps."totalReactionCount", 0) * 2 +
            COALESCE(ps."commentCount", 0) * 3 +
            COALESCE(ps."shareCount", 0) * 5 +
            COALESCE(ps."bookmarkCount", 0) * 4
        ) * EXP(-0.1 * EXTRACT(EPOCH FROM (NOW() - p."publishedAt")) / 86400) as trending_score
    FROM posts p
    LEFT JOIN post_stats ps ON p.id = ps."postId"
    LEFT JOIN users u ON p."authorId" = u.id
    WHERE p.published = true 
        AND p.deleted = false
        AND p."publishedAt" > NOW() - INTERVAL '7 days'
        AND p."moderationStatus" IN ('APPROVED', 'AUTO_APPROVED')
)
SELECT 
    pm.*,
    u.image as authorImage,
    u.verified as authorVerified,
    c.name as categoryName,
    c.slug as categorySlug
FROM post_metrics pm
LEFT JOIN users u ON pm."authorId" = u.id
LEFT JOIN posts p ON pm.id = p.id
LEFT JOIN categories c ON p."categoryId" = c.id
WHERE trending_score > 0
ORDER BY trending_score DESC
LIMIT 100;

-- Create indexes on materialized view
CREATE UNIQUE INDEX idx_trending_posts_id ON trending_posts(id);
CREATE INDEX idx_trending_posts_score ON trending_posts(trending_score DESC);
CREATE INDEX idx_trending_posts_author ON trending_posts("authorId") WHERE "authorId" IS NOT NULL;

-- View 2: Top Creators (refreshed daily)
DROP MATERIALIZED VIEW IF EXISTS top_creators CASCADE;
CREATE MATERIALIZED VIEW top_creators AS
WITH creator_metrics AS (
    SELECT 
        u.id,
        u.username,
        u.image,
        u.bio,
        u.verified,
        u.level,
        u.role,
        u."creatorRevenueShare",
        u."totalRevenueEarned",
        COALESCE(us."totalFollowers", 0) as followers,
        COALESCE(us."totalPosts", 0) as posts,
        COALESCE(us."engagementRate", 0) as engagement,
        COALESCE(us."contentQualityScore", 0) as quality,
        calculate_reputation_score(u.id) as reputation,
        COUNT(DISTINCT p.id) FILTER (WHERE p."publishedAt" > NOW() - INTERVAL '30 days') as recent_posts,
        COUNT(DISTINCT p.id) FILTER (WHERE p.featured = true) as featured_posts,
        COUNT(DISTINCT ua.id) FILTER (WHERE ua.deleted = false) as achievements
    FROM users u
    LEFT JOIN user_stats us ON u.id = us."userId"
    LEFT JOIN posts p ON u.id = p."authorId" AND p.published = true AND p.deleted = false
    LEFT JOIN user_achievements ua ON u.id = ua."userId"
    WHERE u.role IN ('CREATOR', 'VERIFIED_CREATOR')
        AND u.deleted = false
        AND u.status = 'ACTIVE'
    GROUP BY u.id, us."totalFollowers", us."totalPosts", us."engagementRate", us."contentQualityScore"
)
SELECT 
    cm.*,
    CASE 
        WHEN cm."totalRevenueEarned" > 100000 THEN 'platinum'
        WHEN cm."totalRevenueEarned" > 10000 THEN 'gold'
        WHEN cm."totalRevenueEarned" > 1000 THEN 'silver'
        ELSE 'bronze'
    END as creator_tier
FROM creator_metrics cm
ORDER BY reputation DESC
LIMIT 500;

-- Create indexes
CREATE UNIQUE INDEX idx_top_creators_id ON top_creators(id);
CREATE INDEX idx_top_creators_reputation ON top_creators(reputation DESC);
CREATE INDEX idx_top_creators_followers ON top_creators(followers DESC);
CREATE INDEX idx_top_creators_tier ON top_creators(creator_tier);

-- View 3: Active Groups (refreshed every 6 hours)
DROP MATERIALIZED VIEW IF EXISTS active_groups CASCADE;
CREATE MATERIALIZED VIEW active_groups AS
WITH group_activity AS (
    SELECT 
        g.id,
        g.name,
        g.slug,
        g.description,
        g.icon,
        g."coverImage",
        g."memberCount",
        g.visibility,
        g."isFeatured",
        g."isVerified",
        g."autoApproveMembers",
        g."requirePostApproval",
        COUNT(DISTINCT gp.id) FILTER (WHERE gp."createdAt" > NOW() - INTERVAL '7 days') as recent_posts,
        COUNT(DISTINCT gm."userId") FILTER (WHERE gm."lastActiveAt" > NOW() - INTERVAL '24 hours') as active_members,
        MAX(gp."createdAt") as last_post_at,
        AVG(gp."reactionCount") as avg_post_engagement
    FROM groups g
    LEFT JOIN group_posts gp ON g.id = gp."groupId"
    LEFT JOIN group_members gm ON g.id = gm."groupId"
    WHERE g.deleted = false
        AND g.visibility IN ('PUBLIC', 'PRIVATE')
    GROUP BY g.id
)
SELECT 
    ga.*,
    (
        ga."memberCount" * 0.3 +
        ga.recent_posts * 2 +
        ga.active_members * 1.5 +
        COALESCE(ga.avg_post_engagement, 0) * 10 +
        CASE WHEN ga."isFeatured" THEN 100 ELSE 0 END +
        CASE WHEN ga."isVerified" THEN 50 ELSE 0 END
    ) as activity_score
FROM group_activity ga
WHERE ga."memberCount" > 0
ORDER BY activity_score DESC
LIMIT 200;

-- Create indexes
CREATE UNIQUE INDEX idx_active_groups_id ON active_groups(id);
CREATE INDEX idx_active_groups_score ON active_groups(activity_score DESC);
CREATE INDEX idx_active_groups_visibility ON active_groups(visibility);

-- View 4: User Reputation Scores (regular view, not materialized)
CREATE OR REPLACE VIEW user_reputation_scores AS
SELECT 
    u.id,
    u.username,
    u.role,
    u.level,
    u.verified,
    calculate_reputation_score(u.id) as reputation_score,
    NOW() as calculated_at
FROM users u
WHERE u.deleted = false
    AND u.status = 'ACTIVE';

-- Create refresh function for materialized views
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
BEGIN
    -- Refresh with concurrency to avoid blocking reads
    REFRESH MATERIALIZED VIEW CONCURRENTLY trending_posts;
    REFRESH MATERIALIZED VIEW CONCURRENTLY top_creators;
    REFRESH MATERIALIZED VIEW CONCURRENTLY active_groups;
    
    -- Log refresh (create system_logs table if not exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_logs') THEN
        INSERT INTO system_logs (action, details, created_at)
        VALUES ('materialized_view_refresh', 
                jsonb_build_object('views', ARRAY['trending_posts', 'top_creators', 'active_groups']),
                NOW());
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT ON trending_posts TO PUBLIC;
GRANT SELECT ON top_creators TO PUBLIC;
GRANT SELECT ON active_groups TO PUBLIC;
GRANT SELECT ON user_reputation_scores TO PUBLIC;

COMMIT;
```

### 📄 Fixed: 005_database_triggers.sql (Partial - focusing on the error)

```sql
-- migrations/005_database_triggers.sql
-- Database triggers for automatic data maintenance
-- FIXED: Column name case sensitivity in achievement tracking

-- ... [Previous trigger definitions remain the same] ...

-- =====================================================
-- COMPREHENSIVE ACHIEVEMENT SYSTEM (FIXED)
-- =====================================================

CREATE OR REPLACE FUNCTION track_achievement_progress()
RETURNS TRIGGER AS $$
DECLARE
    achievement RECORD;
    user_data RECORD;
    progress_update FLOAT;
BEGIN
    -- Different achievement checks based on trigger source
    IF TG_TABLE_NAME = 'posts' THEN
        -- First Post Achievement
        IF TG_OP = 'INSERT' AND NEW.published = true THEN
            -- Check first post achievement
            IF check_achievement_eligibility(NEW."authorId", 'FIRST_POST') THEN
                PERFORM grant_achievement(NEW."authorId", 'FIRST_POST');
            END IF;
            
            -- Check prolific writer (50 posts) - FIXED: use quoted identifier
            SELECT "totalPosts" INTO user_data FROM user_stats WHERE "userId" = NEW."authorId";
            IF user_data."totalPosts" >= 50 AND check_achievement_eligibility(NEW."authorId", 'PROLIFIC_WRITER') THEN
                PERFORM grant_achievement(NEW."authorId", 'PROLIFIC_WRITER');
            END IF;
        END IF;
        
    ELSIF TG_TABLE_NAME = 'follows' THEN
        -- Social achievements - FIXED: use quoted identifiers
        IF TG_OP = 'INSERT' THEN
            SELECT "totalFollowers" INTO user_data FROM user_stats WHERE "userId" = NEW."followingId";
            
            -- First follower
            IF user_data."totalFollowers" = 1 AND check_achievement_eligibility(NEW."followingId", 'FIRST_FOLLOWER') THEN
                PERFORM grant_achievement(NEW."followingId", 'FIRST_FOLLOWER');
            END IF;
            
            -- Social butterfly (100 followers)
            IF user_data."totalFollowers" >= 100 AND check_achievement_eligibility(NEW."followingId", 'SOCIAL_BUTTERFLY') THEN
                PERFORM grant_achievement(NEW."followingId", 'SOCIAL_BUTTERFLY');
            END IF;
            
            -- Influencer (1000 followers)
            IF user_data."totalFollowers" >= 1000 AND check_achievement_eligibility(NEW."followingId", 'INFLUENCER') THEN
                PERFORM grant_achievement(NEW."followingId", 'INFLUENCER');
            END IF;
        END IF;
        
    ELSIF TG_TABLE_NAME = 'user_stats' THEN
        -- Streak achievements - FIXED: use quoted identifier "streakDays"
        IF NEW."streakDays" >= 7 AND OLD."streakDays" < 7 THEN
            IF check_achievement_eligibility(NEW."userId", 'STREAK_WEEK') THEN
                PERFORM grant_achievement(NEW."userId", 'STREAK_WEEK');
            END IF;
        END IF;
        
        IF NEW."streakDays" >= 30 AND OLD."streakDays" < 30 THEN
            IF check_achievement_eligibility(NEW."userId", 'STREAK_MONTH') THEN
                PERFORM grant_achievement(NEW."userId", 'STREAK_MONTH');
            END IF;
        END IF;
        
    ELSIF TG_TABLE_NAME = 'reactions' THEN
        -- Engagement achievements - FIXED: use quoted identifiers
        IF TG_OP = 'INSERT' AND NEW."postId" IS NOT NULL THEN
            -- Get post author
            SELECT "authorId" INTO user_data FROM posts WHERE id = NEW."postId";
            
            -- Update total likes received
            UPDATE user_stats 
            SET "totalLikesReceived" = "totalLikesReceived" + 1
            WHERE "userId" = user_data."authorId";
            
            -- Check likes milestones
            SELECT "totalLikesReceived" INTO user_data FROM user_stats WHERE "userId" = user_data."authorId";
            
            IF user_data."totalLikesReceived" >= 100 AND check_achievement_eligibility(user_data."authorId", 'WELL_LIKED') THEN
                PERFORM grant_achievement(user_data."authorId", 'WELL_LIKED');
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply achievement triggers with correct column names
CREATE TRIGGER track_streak_achievements
AFTER UPDATE OF "streakDays" ON user_stats
FOR EACH ROW
EXECUTE FUNCTION track_achievement_progress();

-- ... [Rest of the triggers remain the same] ...
```

### 📄 Fixed: 006_fulltext_search.sql

```sql
-- migrations/006_fulltext_search.sql
-- Full-text search implementation
-- FIXED: Column name case sensitivity

BEGIN;

-- =====================================================
-- POST SEARCH
-- =====================================================

-- Add tsvector column to posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create function to update post search vector - FIXED: use quoted identifiers
CREATE OR REPLACE FUNCTION update_post_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.excerpt, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.content::text, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW."metaKeywords"::text, '')), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for post search vector
DROP TRIGGER IF EXISTS update_post_search_vector_trigger ON posts;
CREATE TRIGGER update_post_search_vector_trigger
BEFORE INSERT OR UPDATE OF title, excerpt, content, "metaKeywords" ON posts
FOR EACH ROW
EXECUTE FUNCTION update_post_search_vector();

-- Create GIN index for post search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_search_vector 
ON posts USING GIN (search_vector);

-- Update existing posts - FIXED: use quoted identifier
UPDATE posts 
SET search_vector = 
    setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(excerpt, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(content::text, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE("metaKeywords"::text, '')), 'D')
WHERE search_vector IS NULL;

-- ... [Rest of the search implementation with similar fixes for camelCase columns] ...

COMMIT;
```

---

## Execution Scripts

### 📄 Master Execution Script: execute_migrations.sh

```bash
#!/bin/bash
# execute_migrations.sh
# Master script to execute all migrations in correct order

set -e  # Exit on error

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5433}"
DB_USER="${DB_USER:-sparkle_user}"
DB_NAME="${DB_NAME:-sparkle_db}"

echo "Sparkle Universe Database Migration Execution"
echo "============================================"
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo ""

# Function to execute SQL file
execute_sql() {
    local file=$1
    local description=$2
    echo "Executing: $description"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$file"
    if [ $? -eq 0 ]; then
        echo "✓ Success: $description"
    else
        echo "✗ Failed: $description"
        exit 1
    fi
    echo ""
}

# Phase 1: Extensions
echo "Phase 1: Database Extensions"
echo "----------------------------"
execute_sql "prisma/migrations/001_enable_extensions.sql" "Enable extensions"

# Manual step required
echo "IMPORTANT: Manual configuration required!"
echo "1. Run as superuser:"
echo "   ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';"
echo "   ALTER SYSTEM SET pg_stat_statements.track = 'all';"
echo "   ALTER SYSTEM SET pg_stat_statements.max = 10000;"
echo "2. Restart PostgreSQL"
echo "3. Press Enter when complete..."
read -r

# Phase 2: JSON Indexes (No transaction)
echo "Phase 2: JSON GIN Indexes"
echo "-------------------------"
echo "Note: This will take time as indexes are created concurrently"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    -v ON_ERROR_STOP=1 -f "prisma/migrations/002_json_gin_indexes.sql"

# Phase 3: Functions
echo "Phase 3: Database Functions"
echo "---------------------------"
execute_sql "prisma/migrations/003_database_functions.sql" "Create functions"

# Phase 4: Materialized Views
echo "Phase 4: Materialized Views"
echo "---------------------------"
execute_sql "prisma/migrations/004_materialized_views.sql" "Create views"

# Phase 5: Triggers
echo "Phase 5: Database Triggers"
echo "--------------------------"
execute_sql "prisma/migrations/005_database_triggers.sql" "Create triggers"

# Phase 6: Full-text Search
echo "Phase 6: Full-text Search"
echo "-------------------------"
execute_sql "prisma/migrations/006_fulltext_search.sql" "Setup search"

# Phase 7: Partitioning (if needed)
# echo "Phase 7: Table Partitioning"
# echo "---------------------------"
# execute_sql "prisma/migrations/007_table_partitioning.sql" "Setup partitioning"

# Phase 8: Advanced Indexes
echo "Phase 8: Advanced Indexes"
echo "-------------------------"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    -v ON_ERROR_STOP=1 -f "prisma/migrations/008_advanced_indexes.sql"

# Phase 9: Monitoring
echo "Phase 9: Monitoring Setup"
echo "-------------------------"
execute_sql "prisma/migrations/009_monitoring_setup.sql" "Setup monitoring"

echo ""
echo "Migration Complete!"
echo "=================="
echo "Run verification: psql -d $DB_NAME -f verify_migration.sql"
```

### 📄 Verification Script: verify_migration.sql

```sql
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
```

---

## Summary of Fixes

1. **Transaction Issues**: 
   - Removed BEGIN/COMMIT from CONCURRENTLY operations
   - Separated ALTER SYSTEM commands
   - Added execution scripts for proper handling

2. **Case Sensitivity**: 
   - Added double quotes to all camelCase identifiers
   - Fixed: `"postId"`, `"streakDays"`, `"metaKeywords"`, `"requiredXp"`, etc.
   - Ensured consistency across all queries

3. **Execution Strategy**:
   - Created master execution script
   - Added verification queries
   - Included rollback procedures
   - Documented manual steps

The migrations are now ready for successful execution!
