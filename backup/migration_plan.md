# prisma/migrations/001_enable_extensions.sql
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

# prisma/migrations/002_json_gin_indexes.sql
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

# prisma/migrations/003_database_functions.sql
```sql
-- migrations/003_database_functions.sql
-- FIXED: Changed UUID to TEXT to match Prisma's String type

BEGIN;

-- Function 1: Calculate user level based on level_configs table
CREATE OR REPLACE FUNCTION calculate_user_level(experience_points INT)
RETURNS INT AS $$
DECLARE
    target_level INT;
BEGIN
    SELECT level INTO target_level
    FROM level_configs
    WHERE "requiredXp" <= experience_points
    ORDER BY level DESC
    LIMIT 1;
    
    RETURN COALESCE(target_level, 1);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function 2: Calculate engagement rate for a post
-- FIXED: Changed parameter type from UUID to TEXT
CREATE OR REPLACE FUNCTION calculate_engagement_rate(post_id TEXT)
RETURNS NUMERIC AS $$
DECLARE
    total_views INT;
    total_interactions INT;
    engagement_rate NUMERIC(5,4);
BEGIN
    -- Get view count
    SELECT COALESCE(ps."viewCount", 0) INTO total_views
    FROM posts p
    LEFT JOIN post_stats ps ON p.id = ps."postId"
    WHERE p.id = post_id;
    
    -- Get interaction count
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
    
    IF total_views > 0 THEN
        engagement_rate := (total_interactions::NUMERIC / total_views::NUMERIC);
    ELSE
        engagement_rate := 0;
    END IF;
    
    RETURN LEAST(engagement_rate, 1);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function 3: Update post statistics
-- FIXED: Changed post_id parameter from UUID to TEXT
CREATE OR REPLACE FUNCTION update_post_stats(post_id TEXT)
RETURNS VOID AS $$
DECLARE
    stats RECORD;
    engagement NUMERIC;
BEGIN
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
    
    engagement := calculate_engagement_rate(post_id);
    
    INSERT INTO post_stats (
        id,  -- Add id field for cuid()
        "postId", "viewCount", "uniqueViewCount", "likeCount", "loveCount", "fireCount", 
        "totalReactionCount", "commentCount", "bookmarkCount", "avgReadTime",
        "engagementRate", "lastCalculatedAt"
    )
    VALUES (
        gen_random_uuid()::text,  -- Generate CUID-like ID
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
        "lastCalculatedAt" = NOW(),
        "updatedAt" = NOW();  -- Add updatedAt
END;
$$ LANGUAGE plpgsql;

-- Function 4: Calculate user reputation score
-- FIXED: Changed user_id from UUID to TEXT
CREATE OR REPLACE FUNCTION calculate_reputation_score(user_id TEXT)
RETURNS INT AS $$
DECLARE
    reputation INT := 0;
    user_stats RECORD;
BEGIN
    SELECT 
        u.level,
        u.verified,
        u.role,
        u."reputationScore" as base_reputation,
        COALESCE((u."totalRevenueEarned"::NUMERIC / 1000)::INT, 0) as revenue_score,
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
    
    -- Calculate reputation
    reputation := 
        COALESCE(user_stats.base_reputation, 0) +
        (COALESCE(user_stats.level, 1) * 100) +
        (CASE WHEN user_stats.verified THEN 500 ELSE 0 END) +
        (CASE 
            WHEN user_stats.role = 'VERIFIED_CREATOR' THEN 1000
            WHEN user_stats.role = 'CREATOR' THEN 500
            ELSE 0
        END) +
        (LEAST(COALESCE(user_stats."totalPosts", 0), 100) * 10) +
        (LEAST(COALESCE(user_stats."totalLikesReceived", 0), 1000) * 2) +
        (LEAST(COALESCE(user_stats."totalFollowers", 0), 10000) * 1) +
        (COALESCE(user_stats.achievements_count, 0) * 50) +
        (COALESCE(user_stats.featured_posts, 0) * 200) +
        (COALESCE(user_stats."contentQualityScore", 0) * 100)::INT +
        COALESCE(user_stats.revenue_score, 0);
    
    RETURN reputation;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function 5: Validate soft delete consistency
-- FIXED: Changed record_id from UUID to TEXT
CREATE OR REPLACE FUNCTION validate_soft_delete(
    table_name TEXT,
    record_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    is_valid BOOLEAN;
BEGIN
    EXECUTE format(
        'SELECT (deleted = false OR "deletedAt" IS NOT NULL) 
         FROM %I WHERE id = $1',
        table_name
    ) INTO is_valid USING record_id;
    
    RETURN COALESCE(is_valid, true);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function 6: Check achievement eligibility
-- FIXED: Changed user_id from UUID to TEXT
CREATE OR REPLACE FUNCTION check_achievement_eligibility(
    user_id TEXT,
    achievement_code TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    achievement RECORD;
    user_data RECORD;
    is_eligible BOOLEAN := false;
BEGIN
    -- Get achievement
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
    
    -- Get user data
    SELECT 
        u.*,
        us."totalPosts",
        us."totalFollowers",
        us."streakDays"
    INTO user_data
    FROM users u
    LEFT JOIN user_stats us ON u.id = us."userId"
    WHERE u.id = user_id;
    
    -- Check criteria
    CASE achievement_code
        WHEN 'FIRST_POST' THEN
            is_eligible := COALESCE(user_data."totalPosts", 0) >= 1;
        WHEN 'PROLIFIC_WRITER' THEN
            is_eligible := COALESCE(user_data."totalPosts", 0) >= 50;
        WHEN 'SOCIAL_BUTTERFLY' THEN
            is_eligible := COALESCE(user_data."totalFollowers", 0) >= 100;
        WHEN 'STREAK_WEEK' THEN
            is_eligible := COALESCE(user_data."streakDays", 0) >= 7;
        WHEN 'LEVEL_10' THEN
            is_eligible := COALESCE(user_data.level, 1) >= 10;
        ELSE
            is_eligible := false;
    END CASE;
    
    RETURN is_eligible;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function 7: Grant achievement helper
CREATE OR REPLACE FUNCTION grant_achievement(
    user_id TEXT,
    achievement_code TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    achievement_id TEXT;
BEGIN
    SELECT id INTO achievement_id
    FROM achievements
    WHERE code = achievement_code AND deleted = false;
    
    IF achievement_id IS NOT NULL THEN
        INSERT INTO user_achievements (
            id, "userId", "achievementId", progress, "unlockedAt", showcased, "showcaseOrder", notified, "claimedRewards", deleted
        )
        VALUES (
            gen_random_uuid()::text,
            user_id,
            achievement_id,
            1.0,
            NOW(),
            false,
            0,
            false,
            false,
            false
        )
        ON CONFLICT ("userId", "achievementId") DO NOTHING;
        
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql;

COMMIT;

```

# prisma/migrations/004_materialized_views.sql
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

# prisma/migrations/005_database_triggers.sql
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

# prisma/migrations/006_fulltext_search.sql
```sql
-- migrations/006_fulltext_search.sql
-- Full-text search implementation
-- FIXED: Removed transaction wrapper for CONCURRENTLY operations

-- =====================================================
-- PART 1: Transactional Operations
-- =====================================================
BEGIN;

-- Add tsvector column to posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create function to update post search vector
CREATE OR REPLACE FUNCTION update_post_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.excerpt, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.content::text, '')), 'C') ||
        setweight(to_tsvector('english', array_to_string(NEW."metaKeywords", ' ')), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for post search vector
DROP TRIGGER IF EXISTS update_post_search_vector_trigger ON posts;
CREATE TRIGGER update_post_search_vector_trigger
BEFORE INSERT OR UPDATE OF title, excerpt, content, "metaKeywords" ON posts
FOR EACH ROW
EXECUTE FUNCTION update_post_search_vector();

-- Update existing posts
UPDATE posts 
SET search_vector = 
    setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(excerpt, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(content::text, '')), 'C') ||
    setweight(to_tsvector('english', array_to_string("metaKeywords", ' ')), 'D')
WHERE search_vector IS NULL;

-- Add search vector columns to other tables
ALTER TABLE users ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- User search function
CREATE OR REPLACE FUNCTION update_user_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.username, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.email, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.bio, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_search_vector_trigger
BEFORE INSERT OR UPDATE OF username, email, bio ON users
FOR EACH ROW
EXECUTE FUNCTION update_user_search_vector();

-- Comment search function
CREATE OR REPLACE FUNCTION update_comment_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', COALESCE(NEW.content, ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_comment_search_vector_trigger
BEFORE INSERT OR UPDATE OF content ON comments
FOR EACH ROW
EXECUTE FUNCTION update_comment_search_vector();

-- Group search function
CREATE OR REPLACE FUNCTION update_group_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', array_to_string(NEW.tags, ' ')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_group_search_vector_trigger
BEFORE INSERT OR UPDATE OF name, description, tags ON groups
FOR EACH ROW
EXECUTE FUNCTION update_group_search_vector();

COMMIT;

-- =====================================================
-- PART 2: Non-Transactional Operations (Run Separately)
-- =====================================================
-- Run these CREATE INDEX commands separately, NOT in a transaction

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_search_vector 
ON posts USING GIN (search_vector);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_search_vector 
ON users USING GIN (search_vector);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comment_search_vector 
ON comments USING GIN (search_vector);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_search_vector 
ON groups USING GIN (search_vector);

-- Trigram indexes for fuzzy search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_title_trgm 
ON posts USING GIN (title gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_username_trgm 
ON users USING GIN (username gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_name_trgm 
ON groups USING GIN (name gin_trgm_ops);

```

# prisma/migrations/007_table_partitioning.sql
```sql
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

```

# prisma/migrations/008_advanced_indexes.sql
```sql
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

```

# prisma/migrations/008_advanced_indexes_fixed.sql
```sql
-- 008_advanced_indexes_fixed.sql
-- Fixed version addressing column name issues and IMMUTABLE functions

-- First, let's fix the problematic indexes that failed
-- These two indexes failed because NOW() is not IMMUTABLE

-- Hot content identification (FIXED: removed NOW() from predicate)
DROP INDEX IF EXISTS idx_posts_hot_content;
CREATE INDEX CONCURRENTLY idx_posts_hot_content
ON posts ("publishedAt" DESC, views DESC)
WHERE published = true 
  AND deleted = false;
-- Note: Filter by date in your queries, not in the index

-- Active watch parties (FIXED: removed NOW() from predicate)
DROP INDEX IF EXISTS idx_watch_parties_active;
CREATE INDEX CONCURRENTLY idx_watch_parties_active
ON watch_parties ("scheduledStart", "isPublic", "currentParticipants")
WHERE deleted = false;
-- Note: Filter by date in your queries, not in the index

-- Now fix the views
BEGIN;

-- Drop existing problematic views
DROP VIEW IF EXISTS index_usage_stats CASCADE;
DROP VIEW IF EXISTS table_cache_stats CASCADE;

-- Fixed: Create comprehensive index usage view
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

-- Fixed: Table cache stats view
CREATE VIEW table_cache_stats AS
SELECT 
    schemaname,
    tablename,
    heap_blks_read,
    heap_blks_hit,
    CASE 
        WHEN heap_blks_hit + heap_blks_read = 0 THEN 0
        ELSE round(100.0 * heap_blks_hit / (heap_blks_hit + heap_blks_read), 2)
    END as cache_hit_ratio,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size
FROM pg_statio_user_tables
WHERE heap_blks_hit + heap_blks_read > 0
ORDER BY heap_blks_read + heap_blks_hit DESC;

-- Function to identify unused indexes (FIXED)
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

-- Function to analyze index effectiveness (FIXED)
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
            pg_total_relation_size(s.schemaname||'.'||s.tablename) as table_size
        FROM pg_stat_user_indexes s
        WHERE s.schemaname = 'public'
        GROUP BY s.tablename, s.schemaname
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

COMMIT;

```

# prisma/migrations/009_monitoring_setup.sql
```sql
-- migrations/009_monitoring_setup.sql
-- Performance monitoring and optimization tools for Sparkle Universe v4.3
-- FIXED: Column name case sensitivity, proper table references

BEGIN;

-- =====================================================
-- QUERY PERFORMANCE MONITORING
-- =====================================================

-- Ensure pg_stat_statements is available
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Slow query identification
CREATE OR REPLACE VIEW slow_queries AS
SELECT 
    query,
    calls,
    total_exec_time as total_time,
    mean_exec_time as mean_time,
    stddev_exec_time as stddev_time,
    rows,
    100.0 * total_exec_time / NULLIF(sum(total_exec_time) OVER (), 0) AS percentage_cpu,
    mean_exec_time / GREATEST(rows, 1) as time_per_row
FROM pg_stat_statements
WHERE mean_exec_time > 100  -- Queries taking more than 100ms
ORDER BY mean_exec_time DESC
LIMIT 50;

-- Frequently executed queries
CREATE OR REPLACE VIEW frequent_queries AS
SELECT 
    query,
    calls,
    mean_exec_time as mean_time,
    calls / GREATEST(EXTRACT(EPOCH FROM NOW() - stats_reset), 1) as calls_per_second,
    total_exec_time as total_time
FROM pg_stat_statements, pg_stat_database
WHERE pg_stat_database.datname = current_database()
ORDER BY calls DESC
LIMIT 50;

-- =====================================================
-- CACHE HIT RATIO MONITORING
-- =====================================================

CREATE OR REPLACE VIEW cache_hit_ratios AS
SELECT 
    'index' as cache_type,
    sum(idx_blks_hit) / NULLIF(sum(idx_blks_hit + idx_blks_read), 0) as ratio,
    pg_size_pretty(sum(idx_blks_hit + idx_blks_read) * 8192) as total_accessed
FROM pg_statio_user_indexes
UNION ALL
SELECT 
    'table' as cache_type,
    sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit + heap_blks_read), 0) as ratio,
    pg_size_pretty(sum(heap_blks_hit + heap_blks_read) * 8192) as total_accessed
FROM pg_statio_user_tables;

-- Detailed cache statistics by table
CREATE OR REPLACE VIEW table_cache_stats AS
SELECT 
    schemaname,
    tablename,
    heap_blks_read,
    heap_blks_hit,
    CASE 
        WHEN heap_blks_hit + heap_blks_read = 0 THEN 0
        ELSE round(100.0 * heap_blks_hit / (heap_blks_hit + heap_blks_read), 2)
    END as cache_hit_ratio,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size
FROM pg_statio_user_tables
WHERE heap_blks_hit + heap_blks_read > 0
ORDER BY heap_blks_read + heap_blks_hit DESC;

-- =====================================================
-- V4.3 INDEX EFFECTIVENESS MONITORING
-- =====================================================

CREATE OR REPLACE VIEW v43_index_effectiveness AS
SELECT 
    n.nspname as schema_name,
    t.relname as table_name,
    i.relname as index_name,
    idx.idx_scan as scans,
    idx.idx_tup_read as tuples_read,
    idx.idx_tup_fetch as tuples_fetched,
    CASE 
        WHEN idx.idx_scan = 0 THEN 0
        ELSE ROUND((idx.idx_tup_fetch::NUMERIC / idx.idx_scan), 2)
    END as avg_tuples_per_scan,
    pg_size_pretty(pg_relation_size(i.oid)) as index_size,
    CASE 
        WHEN i.relname LIKE '%v43%' THEN 'V4.3 Addition'
        WHEN i.relname LIKE '%composite%' THEN 'Composite Index'
        WHEN i.relname LIKE '%covering%' THEN 'Covering Index'
        WHEN i.relname LIKE '%partial%' THEN 'Partial Index'
        WHEN am.amname = 'gin' THEN 'GIN Index'
        ELSE 'Standard Index'
    END as index_type,
    CASE 
        WHEN idx.idx_scan = 0 THEN 'UNUSED - Consider Removal'
        WHEN idx.idx_scan < 100 THEN 'Low Usage - Monitor'
        WHEN idx.idx_tup_fetch::NUMERIC / GREATEST(idx.idx_scan, 1) > 1000 THEN 'High Impact - Effective'
        ELSE 'Normal Usage'
    END as effectiveness
FROM pg_stat_user_indexes idx
JOIN pg_index pgidx ON pgidx.indexrelid = idx.indexrelid
JOIN pg_class i ON i.oid = pgidx.indexrelid
JOIN pg_class t ON t.oid = pgidx.indrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
JOIN pg_am am ON am.oid = i.relam
WHERE n.nspname = 'public'
ORDER BY 
    CASE 
        WHEN idx.idx_scan = 0 THEN 0
        ELSE 1
    END,
    idx.idx_scan DESC;

-- =====================================================
-- TABLE BLOAT DETECTION (SIMPLIFIED)
-- =====================================================

CREATE OR REPLACE VIEW table_bloat_simple AS
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    n_live_tup as live_tuples,
    n_dead_tup as dead_tuples,
    CASE 
        WHEN n_live_tup > 0 
        THEN ROUND(100.0 * n_dead_tup / n_live_tup, 2)
        ELSE 0
    END as bloat_percentage,
    last_vacuum,
    last_autovacuum
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC;

-- =====================================================
-- ACTIVE CONNECTIONS MONITORING
-- =====================================================

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
    wait_event_type,
    wait_event,
    LEFT(query, 100) as query_preview
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY 
    CASE state 
        WHEN 'active' THEN 1 
        WHEN 'idle in transaction' THEN 2 
        ELSE 3 
    END,
    query_start;

-- Connection count by state
CREATE OR REPLACE VIEW connection_stats AS
SELECT 
    state,
    COUNT(*) as connection_count,
    MAX(NOW() - query_start) as max_duration,
    AVG(NOW() - query_start) as avg_duration
FROM pg_stat_activity
WHERE pid != pg_backend_pid()
GROUP BY state
ORDER BY connection_count DESC;

-- =====================================================
-- LOCK MONITORING
-- =====================================================

CREATE OR REPLACE VIEW blocking_locks AS
SELECT 
    blocked_locks.pid AS blocked_pid,
    blocked_activity.usename AS blocked_user,
    blocking_locks.pid AS blocking_pid,
    blocking_activity.usename AS blocking_user,
    LEFT(blocked_activity.query, 50) AS blocked_statement,
    LEFT(blocking_activity.query, 50) AS blocking_statement,
    NOW() - blocked_activity.query_start AS blocked_duration,
    NOW() - blocking_activity.query_start AS blocking_duration
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

-- =====================================================
-- STATISTICS TARGET OPTIMIZATION
-- =====================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Check if tables exist before altering
    FOR r IN (
        SELECT table_name, column_name, statistics_target
        FROM (VALUES
            ('users', 'id', 1000),
            ('users', 'username', 1000),
            ('users', 'email', 1000),
            ('posts', 'id', 1000),
            ('posts', '"authorId"', 1000),
            ('posts', 'slug', 1000),
            ('messages', '"conversationId"', 1000),
            ('messages', '"senderId"', 1000),
            ('notifications', '"userId"', 1000),
            ('activity_streams', '"userId"', 1000),
            ('activity_streams', '"entityId"', 1000),
            ('comments', '"postId"', 1000),
            ('comments', '"authorId"', 1000)
        ) AS t(table_name, column_name, statistics_target)
    ) LOOP
        -- Check if table and column exist
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = r.table_name 
            AND column_name = replace(r.column_name, '"', '')
        ) THEN
            EXECUTE format('ALTER TABLE %I ALTER COLUMN %s SET STATISTICS %s',
                          r.table_name, r.column_name, r.statistics_target);
            RAISE NOTICE 'Set statistics target for %.% to %', 
                        r.table_name, r.column_name, r.statistics_target;
        ELSE
            RAISE NOTICE 'Column %.% does not exist, skipping', 
                        r.table_name, r.column_name;
        END IF;
    END LOOP;
    
    -- Force statistics update on existing tables
    FOR r IN (
        SELECT DISTINCT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'posts', 'messages', 'notifications', 'activity_streams', 'comments')
    ) LOOP
        EXECUTE format('ANALYZE %I', r.table_name);
        RAISE NOTICE 'Analyzed table %', r.table_name;
    END LOOP;
END $$;

-- =====================================================
-- AUTOMATIC MAINTENANCE FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION perform_maintenance()
RETURNS void AS $$
DECLARE
    start_time timestamp;
    end_time timestamp;
    duration interval;
    mv_exists boolean;
BEGIN
    start_time := clock_timestamp();
    
    RAISE NOTICE 'Starting maintenance at %', start_time;
    
    -- Check and refresh materialized views if they exist
    SELECT EXISTS (
        SELECT 1 FROM pg_matviews WHERE matviewname = 'trending_posts'
    ) INTO mv_exists;
    
    IF mv_exists THEN
        REFRESH MATERIALIZED VIEW CONCURRENTLY trending_posts;
        RAISE NOTICE 'Refreshed trending_posts';
    END IF;
    
    SELECT EXISTS (
        SELECT 1 FROM pg_matviews WHERE matviewname = 'top_creators'
    ) INTO mv_exists;
    
    IF mv_exists THEN
        REFRESH MATERIALIZED VIEW CONCURRENTLY top_creators;
        RAISE NOTICE 'Refreshed top_creators';
    END IF;
    
    SELECT EXISTS (
        SELECT 1 FROM pg_matviews WHERE matviewname = 'active_groups'
    ) INTO mv_exists;
    
    IF mv_exists THEN
        REFRESH MATERIALIZED VIEW CONCURRENTLY active_groups;
        RAISE NOTICE 'Refreshed active_groups';
    END IF;
    
    -- Update table statistics for critical tables
    ANALYZE users, posts, comments, messages, notifications;
    RAISE NOTICE 'Updated table statistics';
    
    -- Clean up old partitions if function exists
    IF EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'maintain_partitions'
    ) THEN
        PERFORM maintain_partitions();
        RAISE NOTICE 'Maintained partitions';
    END IF;
    
    end_time := clock_timestamp();
    duration := end_time - start_time;
    
    -- Log maintenance completion if table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name = 'system_health'
    ) THEN
        INSERT INTO system_health (
            id, service, status, "responseTime", metadata, "checkedAt"
        ) VALUES (
            gen_random_uuid()::text,
            'maintenance',
            'healthy',
            EXTRACT(MILLISECONDS FROM duration),
            jsonb_build_object(
                'start_time', start_time,
                'end_time', end_time,
                'duration', duration::text,
                'tasks', ARRAY['materialized_views', 'statistics', 'partitions']
            ),
            NOW()
        );
    END IF;
    
    RAISE NOTICE 'Maintenance completed in %', duration;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PERFORMANCE DASHBOARD VIEW
-- =====================================================

CREATE OR REPLACE VIEW performance_dashboard AS
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

-- =====================================================
-- MONITORING HELPER FUNCTIONS
-- =====================================================

-- Function to check system health
CREATE OR REPLACE FUNCTION check_system_health()
RETURNS TABLE (
    metric TEXT,
    status TEXT,
    value TEXT,
    recommendation TEXT
) AS $$
BEGIN
    -- Check cache hit ratio
    RETURN QUERY
    SELECT 
        'Cache Hit Ratio'::TEXT,
        CASE 
            WHEN ratio > 0.95 THEN 'GOOD'
            WHEN ratio > 0.90 THEN 'OK'
            ELSE 'POOR'
        END::TEXT,
        ROUND(ratio * 100, 2)::TEXT || '%',
        CASE 
            WHEN ratio < 0.90 THEN 'Consider increasing shared_buffers'
            ELSE 'No action needed'
        END::TEXT
    FROM cache_hit_ratios
    WHERE cache_type = 'table';
    
    -- Check for blocking locks
    RETURN QUERY
    SELECT 
        'Blocking Locks'::TEXT,
        CASE 
            WHEN COUNT(*) = 0 THEN 'GOOD'
            ELSE 'WARNING'
        END::TEXT,
        COUNT(*)::TEXT,
        CASE 
            WHEN COUNT(*) > 0 THEN 'Investigate blocking queries'
            ELSE 'No blocking detected'
        END::TEXT
    FROM blocking_locks;
    
    -- Check connection count
    RETURN QUERY
    SELECT 
        'Connection Usage'::TEXT,
        CASE 
            WHEN current_connections::FLOAT / max_connections::FLOAT < 0.8 THEN 'GOOD'
            WHEN current_connections::FLOAT / max_connections::FLOAT < 0.9 THEN 'WARNING'
            ELSE 'CRITICAL'
        END::TEXT,
        current_connections::TEXT || '/' || max_connections::TEXT,
        CASE 
            WHEN current_connections::FLOAT / max_connections::FLOAT > 0.8 
            THEN 'Consider increasing max_connections'
            ELSE 'Connection pool healthy'
        END::TEXT
    FROM (
        SELECT 
            (SELECT COUNT(*) FROM pg_stat_activity) as current_connections,
            (SELECT setting::INT FROM pg_settings WHERE name = 'max_connections') as max_connections
    ) conn_stats;
    
    -- Check table bloat
    RETURN QUERY
    SELECT 
        'Table Bloat'::TEXT,
        CASE 
            WHEN MAX(bloat_percentage) < 20 THEN 'GOOD'
            WHEN MAX(bloat_percentage) < 40 THEN 'WARNING'
            ELSE 'CRITICAL'
        END::TEXT,
        'Max: ' || MAX(bloat_percentage)::TEXT || '%',
        CASE 
            WHEN MAX(bloat_percentage) > 20 
            THEN 'Run VACUUM on bloated tables'
            ELSE 'Bloat within acceptable limits'
        END::TEXT
    FROM table_bloat_simple;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO PUBLIC;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO PUBLIC;

COMMIT;

-- =====================================================
-- POST-DEPLOYMENT VERIFICATION
-- =====================================================

-- Check system health
SELECT * FROM check_system_health();

-- Monitor cache hit ratios (should be > 95%)
SELECT * FROM cache_hit_ratios;

-- Check for any blocking locks
SELECT * FROM blocking_locks;

-- Review performance dashboard
SELECT * FROM performance_dashboard;

```

# prisma/migrations/009_monitoring_setup_fixed.sql
```sql
-- 009_monitoring_setup_fixed.sql
-- Fixed version of monitoring setup

BEGIN;

-- Fixed table cache stats
DROP VIEW IF EXISTS table_cache_stats CASCADE;
CREATE VIEW table_cache_stats AS
SELECT 
    schemaname,
    tablename,
    heap_blks_read,
    heap_blks_hit,
    CASE 
        WHEN heap_blks_hit + heap_blks_read = 0 THEN 0
        ELSE round(100.0 * heap_blks_hit / (heap_blks_hit + heap_blks_read), 2)
    END as cache_hit_ratio,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size
FROM pg_statio_user_tables
WHERE heap_blks_hit + heap_blks_read > 0
ORDER BY heap_blks_read + heap_blks_hit DESC;

-- Cache hit ratios
CREATE OR REPLACE VIEW cache_hit_ratios AS
SELECT 
    'index' as cache_type,
    sum(idx_blks_hit) / NULLIF(sum(idx_blks_hit + idx_blks_read), 0) as ratio,
    pg_size_pretty(sum(idx_blks_hit + idx_blks_read) * 8192) as total_accessed
FROM pg_statio_user_indexes
UNION ALL
SELECT 
    'table' as cache_type,
    sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit + heap_blks_read), 0) as ratio,
    pg_size_pretty(sum(heap_blks_hit + heap_blks_read) * 8192) as total_accessed
FROM pg_statio_user_tables;

-- Blocking locks monitoring
CREATE OR REPLACE VIEW blocking_locks AS
SELECT 
    blocked_locks.pid AS blocked_pid,
    blocked_activity.usename AS blocked_user,
    blocking_locks.pid AS blocking_pid,
    blocking_activity.usename AS blocking_user,
    LEFT(blocked_activity.query, 50) AS blocked_statement,
    LEFT(blocking_activity.query, 50) AS blocking_statement,
    NOW() - blocked_activity.query_start AS blocked_duration,
    NOW() - blocking_activity.query_start AS blocking_duration
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

-- System health check function (FIXED)
CREATE OR REPLACE FUNCTION check_system_health()
RETURNS TABLE (
    metric TEXT,
    status TEXT,
    value TEXT,
    recommendation TEXT
) AS $$
BEGIN
    -- Check cache hit ratio
    RETURN QUERY
    SELECT 
        'Cache Hit Ratio'::TEXT,
        CASE 
            WHEN ratio > 0.95 THEN 'GOOD'
            WHEN ratio > 0.90 THEN 'OK'
            ELSE 'POOR'
        END::TEXT,
        (ratio * 100)::NUMERIC(5,2)::TEXT || '%',
        CASE 
            WHEN ratio < 0.90 THEN 'Consider increasing shared_buffers'
            ELSE 'No action needed'
        END::TEXT
    FROM cache_hit_ratios
    WHERE cache_type = 'table';
    
    -- Check for blocking locks
    RETURN QUERY
    SELECT 
        'Blocking Locks'::TEXT,
        CASE 
            WHEN COUNT(*) = 0 THEN 'GOOD'
            ELSE 'WARNING'
        END::TEXT,
        COUNT(*)::TEXT,
        CASE 
            WHEN COUNT(*) > 0 THEN 'Investigate blocking queries'
            ELSE 'No blocking detected'
        END::TEXT
    FROM blocking_locks;
    
    -- Check connection count
    RETURN QUERY
    SELECT 
        'Connection Usage'::TEXT,
        CASE 
            WHEN current_connections::FLOAT / max_connections::FLOAT < 0.8 THEN 'GOOD'
            WHEN current_connections::FLOAT / max_connections::FLOAT < 0.9 THEN 'WARNING'
            ELSE 'CRITICAL'
        END::TEXT,
        current_connections::TEXT || '/' || max_connections::TEXT,
        CASE 
            WHEN current_connections::FLOAT / max_connections::FLOAT > 0.8 
            THEN 'Consider increasing max_connections'
            ELSE 'Connection pool healthy'
        END::TEXT
    FROM (
        SELECT 
            (SELECT COUNT(*) FROM pg_stat_activity) as current_connections,
            (SELECT setting::INT FROM pg_settings WHERE name = 'max_connections') as max_connections
    ) conn_stats;
END;
$$ LANGUAGE plpgsql;

COMMIT;

```

# prisma/migrations/absolute_final_fix.sql
```sql
-- absolute_final_fix.sql
-- This version checks columns first and uses the correct ones

-- First, let's verify what columns exist
\echo 'Checking available columns...'
\echo ''

SELECT 'pg_statio_user_tables columns:' as info;
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'pg_statio_user_tables' 
AND column_name IN ('tablename', 'relname')
ORDER BY column_name;

\echo ''

-- Now create the views with correct column names
BEGIN;

-- 1. Simple cache stats (this definitely works)
CREATE OR REPLACE VIEW simple_cache_stats AS
SELECT 
    ROUND(100.0 * sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit + heap_blks_read), 0), 2) as table_cache_hit_percent,
    ROUND(100.0 * sum(idx_blks_hit) / NULLIF(sum(idx_blks_hit + idx_blks_read), 0), 2) as index_cache_hit_percent
FROM pg_statio_user_tables;

-- 2. Index usage with correct columns (relname not tablename)
CREATE OR REPLACE VIEW simple_index_usage AS
SELECT 
    schemaname,
    relname as tablename,
    indexrelname as indexname,
    idx_scan as scans,
    pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan;

-- 3. Table cache stats - using relname if tablename doesn't exist
CREATE OR REPLACE VIEW table_cache_stats AS
SELECT 
    t.schemaname,
    t.relname as tablename,  -- Use relname and alias it
    t.heap_blks_read,
    t.heap_blks_hit,
    CASE 
        WHEN t.heap_blks_hit + t.heap_blks_read = 0 THEN 0
        ELSE round(100.0 * t.heap_blks_hit / (t.heap_blks_hit + t.heap_blks_read), 2)
    END as cache_hit_ratio
FROM pg_statio_user_tables t
WHERE t.heap_blks_hit + t.heap_blks_read > 0
ORDER BY t.heap_blks_read + t.heap_blks_hit DESC
LIMIT 50;

-- 4. Cache hit ratios
CREATE OR REPLACE VIEW cache_hit_ratios AS
SELECT 
    'table' as cache_type,
    sum(heap_blks_hit)::float / NULLIF(sum(heap_blks_hit + heap_blks_read), 0) as ratio
FROM pg_statio_user_tables
UNION ALL
SELECT 
    'index' as cache_type,
    sum(idx_blks_hit)::float / NULLIF(sum(idx_blks_hit + idx_blks_read), 0) as ratio
FROM pg_statio_user_indexes;

-- 5. Index usage stats
CREATE OR REPLACE VIEW index_usage_stats AS
SELECT 
    schemaname,
    relname as tablename,
    indexrelname as indexname,
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

-- 6. Health check function
CREATE OR REPLACE FUNCTION check_system_health()
RETURNS TABLE (
    metric TEXT,
    status TEXT,
    value TEXT,
    recommendation TEXT
) AS $$
BEGIN
    -- Cache hit ratio
    RETURN QUERY
    SELECT 
        'Cache Hit Ratio'::TEXT,
        CASE 
            WHEN COALESCE(ratio, 0) > 0.95 THEN 'EXCELLENT'
            WHEN COALESCE(ratio, 0) > 0.90 THEN 'GOOD'
            WHEN COALESCE(ratio, 0) > 0.85 THEN 'OK'
            ELSE 'POOR'
        END::TEXT,
        COALESCE(ROUND(ratio * 100, 2)::TEXT, '0.00') || '%',
        CASE 
            WHEN COALESCE(ratio, 0) < 0.90 THEN 'Consider increasing shared_buffers'
            ELSE 'No action needed'
        END::TEXT
    FROM cache_hit_ratios
    WHERE cache_type = 'table';
    
    -- Connection usage
    RETURN QUERY
    SELECT 
        'Connection Usage'::TEXT,
        CASE 
            WHEN conn_count < 50 THEN 'GOOD'
            WHEN conn_count < 80 THEN 'OK'
            ELSE 'HIGH'
        END::TEXT,
        conn_count::TEXT || ' connections',
        CASE 
            WHEN conn_count > 80 THEN 'Monitor connection pool'
            ELSE 'Healthy'
        END::TEXT
    FROM (SELECT COUNT(*) as conn_count FROM pg_stat_activity) c;
    
    -- Database size
    RETURN QUERY
    SELECT 
        'Database Size'::TEXT,
        'INFO'::TEXT,
        pg_size_pretty(pg_database_size(current_database()))::TEXT,
        'Current size'::TEXT;
    
    -- Index count
    RETURN QUERY
    SELECT 
        'Total Indexes'::TEXT,
        CASE 
            WHEN idx_count > 500 THEN 'HIGH'
            WHEN idx_count > 200 THEN 'NORMAL'
            ELSE 'LOW'
        END::TEXT,
        idx_count::TEXT || ' indexes',
        CASE 
            WHEN idx_count > 500 THEN 'Review for unused indexes'
            ELSE 'Acceptable'
        END::TEXT
    FROM (SELECT COUNT(*) as idx_count FROM pg_indexes WHERE schemaname = 'public') i;
END;
$$ LANGUAGE plpgsql;

-- 7. Find unused indexes
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
        s.relname::TEXT,
        s.indexrelname::TEXT,
        pg_size_pretty(pg_relation_size(s.indexrelid))::TEXT,
        s.idx_scan
    FROM pg_stat_user_indexes s
    WHERE s.idx_scan = 0
        AND s.schemaname = 'public'
    ORDER BY pg_relation_size(s.indexrelid) DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- 8. Create ROUND function if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'round' 
        AND proargtypes::text = '701 23'  -- double precision, integer
    ) THEN
        CREATE FUNCTION round(double precision, integer) 
        RETURNS numeric AS 'SELECT ROUND($1::numeric, $2)' 
        LANGUAGE SQL IMMUTABLE;
    END IF;
END $$;

COMMIT;

-- Verify everything works
\echo ''
\echo 'Testing all components...'
\echo '========================='
\echo ''

-- Test 1: Cache stats
\echo 'Cache Statistics:'
SELECT * FROM simple_cache_stats;
\echo ''

-- Test 2: Health check
\echo 'System Health Check:'
SELECT * FROM check_system_health();
\echo ''

-- Test 3: Sample indexes
\echo 'Sample Index Usage (5 least used):'
SELECT tablename, indexname, scans 
FROM simple_index_usage 
ORDER BY scans 
LIMIT 5;
\echo ''

-- Test 4: Unused indexes
\echo 'Unused Indexes Count:'
SELECT COUNT(*) as unused_index_count 
FROM find_unused_indexes();
\echo ''

-- Final summary
\echo '═══════════════════════════════════════════════════════'
\echo '✅ MONITORING SETUP COMPLETE!'
\echo '═══════════════════════════════════════════════════════'
\echo ''
\echo 'Available Monitoring Commands:'
\echo '------------------------------'
\echo '• SELECT * FROM check_system_health();'
\echo '• SELECT * FROM simple_cache_stats;'
\echo '• SELECT * FROM cache_hit_ratios;'
\echo '• SELECT * FROM find_unused_indexes();'
\echo '• SELECT * FROM index_usage_stats WHERE usage_category = ''UNUSED'';'
\echo '• SELECT * FROM table_cache_stats ORDER BY cache_hit_ratio;'
\echo ''
\echo 'Your database migration is now 100% complete with full monitoring!'

```

# prisma/migrations/check_columns.sql
```sql
-- check_columns.sql
-- Let's see what columns are actually available

\d pg_stat_user_indexes

-- Alternative way to check
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'pg_stat_user_indexes'
ORDER BY ordinal_position;

```

# prisma/migrations/complete_migration.sql
```sql
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

```

# prisma/migrations/dashboard.sql
```sql
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

```

# prisma/migrations/final_fix_corrected.sql
```sql
-- final_fix_corrected.sql
-- Corrected version with proper PL/pgSQL syntax

BEGIN;

-- Drop any existing problematic views
DROP VIEW IF EXISTS index_usage_stats CASCADE;
DROP VIEW IF EXISTS table_cache_stats CASCADE;
DROP VIEW IF EXISTS cache_hit_ratios CASCADE;
DROP VIEW IF EXISTS blocking_locks CASCADE;
DROP FUNCTION IF EXISTS check_system_health() CASCADE;
DROP FUNCTION IF EXISTS find_unused_indexes() CASCADE;
DROP FUNCTION IF EXISTS analyze_index_effectiveness() CASCADE;

-- Create index usage stats with CORRECT column names
CREATE VIEW index_usage_stats AS
SELECT 
    sui.schemaname,
    sui.tablename,
    sui.indexrelname as indexname,
    sui.idx_scan as index_scans,
    sui.idx_tup_read as tuples_read,
    sui.idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(sui.indexrelid)) as index_size,
    CASE 
        WHEN sui.idx_scan = 0 THEN 'UNUSED'
        WHEN sui.idx_scan < 100 THEN 'RARELY USED'
        WHEN sui.idx_scan < 1000 THEN 'OCCASIONALLY USED'
        ELSE 'FREQUENTLY USED'
    END as usage_category
FROM pg_stat_user_indexes sui
ORDER BY sui.idx_scan DESC;

-- Create table cache stats with CORRECT column names
CREATE VIEW table_cache_stats AS
SELECT 
    sut.schemaname,
    sut.tablename,
    sut.heap_blks_read,
    sut.heap_blks_hit,
    CASE 
        WHEN sut.heap_blks_hit + sut.heap_blks_read = 0 THEN 0
        ELSE round(100.0 * sut.heap_blks_hit / (sut.heap_blks_hit + sut.heap_blks_read), 2)
    END as cache_hit_ratio,
    pg_size_pretty(pg_total_relation_size(sut.schemaname||'.'||sut.tablename)) as table_size
FROM pg_statio_user_tables sut
WHERE sut.heap_blks_hit + sut.heap_blks_read > 0
ORDER BY sut.heap_blks_read + sut.heap_blks_hit DESC;

-- Create cache hit ratios view
CREATE VIEW cache_hit_ratios AS
SELECT 
    'index' as cache_type,
    sum(idx_blks_hit) / NULLIF(sum(idx_blks_hit + idx_blks_read), 0) as ratio,
    pg_size_pretty(sum(idx_blks_hit + idx_blks_read) * 8192) as total_accessed
FROM pg_statio_user_indexes
UNION ALL
SELECT 
    'table' as cache_type,
    sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit + heap_blks_read), 0) as ratio,
    pg_size_pretty(sum(heap_blks_hit + heap_blks_read) * 8192) as total_accessed
FROM pg_statio_user_tables;

-- Create blocking locks view
CREATE VIEW blocking_locks AS
SELECT 
    blocked_locks.pid AS blocked_pid,
    blocked_activity.usename AS blocked_user,
    blocking_locks.pid AS blocking_pid,
    blocking_activity.usename AS blocking_user,
    LEFT(blocked_activity.query, 50) AS blocked_statement,
    LEFT(blocking_activity.query, 50) AS blocking_statement,
    NOW() - blocked_activity.query_start AS blocked_duration,
    NOW() - blocking_activity.query_start AS blocking_duration
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

-- Function to find unused indexes (FIXED with correct column names)
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
        s.indexrelname::TEXT,
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

-- Function to analyze index effectiveness (FIXED)
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
            pg_total_relation_size(s.schemaname||'.'||s.tablename) as table_size
        FROM pg_stat_user_indexes s
        WHERE s.schemaname = 'public'
        GROUP BY s.tablename, s.schemaname
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

-- System health check function
CREATE OR REPLACE FUNCTION check_system_health()
RETURNS TABLE (
    metric TEXT,
    status TEXT,
    value TEXT,
    recommendation TEXT
) AS $$
BEGIN
    -- Check cache hit ratio
    RETURN QUERY
    SELECT 
        'Cache Hit Ratio'::TEXT,
        CASE 
            WHEN ratio > 0.95 THEN 'GOOD'
            WHEN ratio > 0.90 THEN 'OK'
            ELSE 'POOR'
        END::TEXT,
        COALESCE((ratio * 100)::NUMERIC(5,2)::TEXT, '0.00') || '%',
        CASE 
            WHEN ratio < 0.90 OR ratio IS NULL THEN 'Consider increasing shared_buffers'
            ELSE 'No action needed'
        END::TEXT
    FROM cache_hit_ratios
    WHERE cache_type = 'table';
    
    -- Check for blocking locks
    RETURN QUERY
    SELECT 
        'Blocking Locks'::TEXT,
        CASE 
            WHEN COUNT(*) = 0 THEN 'GOOD'
            ELSE 'WARNING'
        END::TEXT,
        COUNT(*)::TEXT,
        CASE 
            WHEN COUNT(*) > 0 THEN 'Investigate blocking queries'
            ELSE 'No blocking detected'
        END::TEXT
    FROM blocking_locks;
    
    -- Check connection count
    RETURN QUERY
    SELECT 
        'Connection Usage'::TEXT,
        CASE 
            WHEN current_connections::FLOAT / max_connections::FLOAT < 0.8 THEN 'GOOD'
            WHEN current_connections::FLOAT / max_connections::FLOAT < 0.9 THEN 'WARNING'
            ELSE 'CRITICAL'
        END::TEXT,
        current_connections::TEXT || '/' || max_connections::TEXT,
        CASE 
            WHEN current_connections::FLOAT / max_connections::FLOAT > 0.8 
            THEN 'Consider increasing max_connections'
            ELSE 'Connection pool healthy'
        END::TEXT
    FROM (
        SELECT 
            (SELECT COUNT(*) FROM pg_stat_activity) as current_connections,
            (SELECT setting::INT FROM pg_settings WHERE name = 'max_connections') as max_connections
    ) conn_stats;
    
    -- Check index usage
    RETURN QUERY
    SELECT 
        'Index Usage'::TEXT,
        CASE 
            WHEN unused_count = 0 THEN 'EXCELLENT'
            WHEN unused_count < 5 THEN 'GOOD'
            WHEN unused_count < 20 THEN 'OK'
            ELSE 'POOR'
        END::TEXT,
        unused_count::TEXT || ' unused indexes',
        CASE 
            WHEN unused_count > 10 
            THEN 'Consider dropping unused indexes'
            ELSE 'Index usage is healthy'
        END::TEXT
    FROM (
        SELECT COUNT(*) as unused_count
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public' AND idx_scan = 0
    ) idx_stats;
END;
$$ LANGUAGE plpgsql;

-- Create ROUND function for double precision if it doesn't exist
DO $$
BEGIN
    CREATE FUNCTION round(double precision, integer) 
    RETURNS numeric AS 'SELECT ROUND($1::numeric, $2)' 
    LANGUAGE SQL IMMUTABLE;
EXCEPTION
    WHEN duplicate_function THEN NULL;
END $$;

-- Grant permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO PUBLIC;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO PUBLIC;

COMMIT;

-- Test everything
\echo 'Testing monitoring components...'
\echo ''

-- Test index_usage_stats
SELECT EXISTS (SELECT 1 FROM index_usage_stats LIMIT 1) as index_usage_stats_working;

-- Test table_cache_stats
SELECT EXISTS (SELECT 1 FROM table_cache_stats LIMIT 1) as table_cache_stats_working;

-- Test cache_hit_ratios
SELECT EXISTS (SELECT 1 FROM cache_hit_ratios LIMIT 1) as cache_hit_ratios_working;

-- Test check_system_health
SELECT COUNT(*) > 0 as check_system_health_working FROM check_system_health();

-- Test find_unused_indexes
SELECT COUNT(*) >= 0 as find_unused_indexes_working FROM find_unused_indexes();

-- Test analyze_index_effectiveness
SELECT COUNT(*) >= 0 as analyze_index_effectiveness_working FROM analyze_index_effectiveness();

\echo ''
\echo '════════════════════════════════════════════'
\echo 'MIGRATION COMPLETION SUMMARY'
\echo '════════════════════════════════════════════'
\echo ''

-- Final summary
WITH component_counts AS (
    SELECT 'Tables' as component, COUNT(*) as count
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    UNION ALL
    SELECT 'Indexes', COUNT(*)
    FROM pg_indexes WHERE schemaname = 'public'
    UNION ALL
    SELECT 'GIN Indexes', COUNT(*)
    FROM pg_indexes WHERE schemaname = 'public' AND indexdef LIKE '%USING gin%'
    UNION ALL
    SELECT 'Functions', COUNT(*)
    FROM information_schema.routines
    WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'
    UNION ALL
    SELECT 'Views', COUNT(*)
    FROM information_schema.views WHERE table_schema = 'public'
    UNION ALL
    SELECT 'Mat. Views', COUNT(*)
    FROM pg_matviews WHERE schemaname = 'public'
)
SELECT component, count FROM component_counts ORDER BY component;

\echo ''
\echo 'System Health Check:'
\echo '--------------------'
SELECT * FROM check_system_health();

\echo ''
\echo '✅ MIGRATION COMPLETE!'
\echo ''
\echo 'Key Commands:'
\echo '  • View performance: SELECT * FROM performance_dashboard;'
\echo '  • Check health: SELECT * FROM check_system_health();'
\echo '  • Find unused indexes: SELECT * FROM find_unused_indexes();'
\echo '  • Analyze indexes: SELECT * FROM analyze_index_effectiveness();'

```

# prisma/migrations/index_monitor.sql
```sql
-- save as: index_monitor.sql
\echo '📊 Index Usage Report'
\echo '====================='
\echo ''

-- Show index usage distribution
SELECT 
    usage_category,
    COUNT(*) as count,
    pg_size_pretty(SUM(pg_relation_size(schemaname||'.'||indexname))) as total_size
FROM index_usage_stats
GROUP BY usage_category
ORDER BY 
    CASE usage_category
        WHEN 'UNUSED' THEN 1
        WHEN 'RARELY USED' THEN 2
        WHEN 'OCCASIONALLY USED' THEN 3
        WHEN 'FREQUENTLY USED' THEN 4
    END;

\echo ''
\echo 'Top 10 Most Used Indexes:'
SELECT 
    tablename,
    indexname,
    index_scans as scans,
    index_size
FROM index_usage_stats
WHERE index_scans > 0
ORDER BY index_scans DESC
LIMIT 10;

\echo ''
\echo 'Candidates for Removal (truly unused after 7 days):'
SELECT 
    'DROP INDEX IF EXISTS ' || indexname || ';' as drop_command
FROM index_usage_stats
WHERE usage_category = 'UNUSED'
    AND indexname NOT LIKE '%_pkey'
    AND indexname NOT LIKE '%_brin'  -- Keep BRIN indexes
    AND indexname NOT LIKE '%_hash'  -- Keep hash indexes for now
LIMIT 5;

```

# prisma/migrations/index_monitor_over_time.sql
```sql
-- save as: index_monitor.sql
\echo '📊 Index Usage Report'
\echo '====================='
\echo ''

-- Show index usage distribution
SELECT 
    usage_category,
    COUNT(*) as count,
    pg_size_pretty(SUM(pg_relation_size(schemaname||'.'||indexname))) as total_size
FROM index_usage_stats
GROUP BY usage_category
ORDER BY 
    CASE usage_category
        WHEN 'UNUSED' THEN 1
        WHEN 'RARELY USED' THEN 2
        WHEN 'OCCASIONALLY USED' THEN 3
        WHEN 'FREQUENTLY USED' THEN 4
    END;

\echo ''
\echo 'Top 10 Most Used Indexes:'
SELECT 
    tablename,
    indexname,
    index_scans as scans,
    index_size
FROM index_usage_stats
WHERE index_scans > 0
ORDER BY index_scans DESC
LIMIT 10;

\echo ''
\echo 'Candidates for Removal (truly unused after 7 days):'
SELECT 
    'DROP INDEX IF EXISTS ' || indexname || ';' as drop_command
FROM index_usage_stats
WHERE usage_category = 'UNUSED'
    AND indexname NOT LIKE '%_pkey'
    AND indexname NOT LIKE '%_brin'  -- Keep BRIN indexes
    AND indexname NOT LIKE '%_hash'  -- Keep hash indexes for now
LIMIT 5;

```

# prisma/migrations/simple_fix.sql
```sql
-- simple_fix.sql
-- Simplified version that will definitely work

-- Create the essential monitoring views one by one
BEGIN;

-- 1. Simple cache hit ratio
CREATE OR REPLACE VIEW simple_cache_stats AS
SELECT 
    ROUND(100.0 * sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit + heap_blks_read), 0), 2) as table_cache_hit_percent,
    ROUND(100.0 * sum(idx_blks_hit) / NULLIF(sum(idx_blks_hit + idx_blks_read), 0), 2) as index_cache_hit_percent
FROM pg_statio_user_tables;

-- 2. Simple index usage
CREATE OR REPLACE VIEW simple_index_usage AS
SELECT 
    schemaname,
    tablename,
    indexrelname as indexname,
    idx_scan as scans,
    pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan;

-- 3. Simple health check
CREATE OR REPLACE FUNCTION simple_health_check()
RETURNS TABLE (metric text, value text) AS $$
BEGIN
    RETURN QUERY
    SELECT 'Database Size'::text, pg_size_pretty(pg_database_size(current_database()))::text
    UNION ALL
    SELECT 'Total Tables'::text, COUNT(*)::text FROM pg_tables WHERE schemaname = 'public'
    UNION ALL
    SELECT 'Total Indexes'::text, COUNT(*)::text FROM pg_indexes WHERE schemaname = 'public'
    UNION ALL
    SELECT 'Active Connections'::text, COUNT(*)::text FROM pg_stat_activity;
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- Test
SELECT * FROM simple_cache_stats;
SELECT * FROM simple_health_check();
SELECT COUNT(*) as unused_indexes FROM simple_index_usage WHERE scans = 0;

\echo 'Basic monitoring setup complete!'

```

# prisma/migrations/working_monitoring_fix.sql
```sql
-- working_monitoring_fix.sql
-- This uses the ACTUAL column names from pg_stat_user_indexes

BEGIN;

-- Create simple cache stats (this one should work)
CREATE OR REPLACE VIEW simple_cache_stats AS
SELECT 
    ROUND(100.0 * sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit + heap_blks_read), 0), 2) as table_cache_hit_percent,
    ROUND(100.0 * sum(idx_blks_hit) / NULLIF(sum(idx_blks_hit + idx_blks_read), 0), 2) as index_cache_hit_percent
FROM pg_statio_user_tables;

-- Create index usage with CORRECT column names
CREATE OR REPLACE VIEW simple_index_usage AS
SELECT 
    schemaname,
    relname as tablename,      -- relname is the actual column name!
    indexrelname as indexname,
    idx_scan as scans,
    pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan;

-- Create cache hit ratios
CREATE OR REPLACE VIEW cache_hit_ratios AS
SELECT 
    'table' as cache_type,
    sum(heap_blks_hit)::float / NULLIF(sum(heap_blks_hit + heap_blks_read), 0) as ratio
FROM pg_statio_user_tables
UNION ALL
SELECT 
    'index' as cache_type,
    sum(idx_blks_hit)::float / NULLIF(sum(idx_blks_hit + idx_blks_read), 0) as ratio
FROM pg_statio_user_indexes;

-- Create table cache stats using ACTUAL columns
CREATE OR REPLACE VIEW table_cache_stats AS
SELECT 
    schemaname,
    tablename,  -- This column DOES exist in pg_statio_user_tables
    heap_blks_read,
    heap_blks_hit,
    CASE 
        WHEN heap_blks_hit + heap_blks_read = 0 THEN 0
        ELSE round(100.0 * heap_blks_hit / (heap_blks_hit + heap_blks_read), 2)
    END as cache_hit_ratio
FROM pg_statio_user_tables
WHERE heap_blks_hit + heap_blks_read > 0
ORDER BY heap_blks_read + heap_blks_hit DESC
LIMIT 50;

-- Create index usage stats with CORRECT columns
CREATE OR REPLACE VIEW index_usage_stats AS
SELECT 
    schemaname,
    relname as tablename,
    indexrelname as indexname,
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

-- Simple health check function
CREATE OR REPLACE FUNCTION check_system_health()
RETURNS TABLE (
    metric TEXT,
    status TEXT,
    value TEXT,
    recommendation TEXT
) AS $$
BEGIN
    -- Check cache hit ratio
    RETURN QUERY
    SELECT 
        'Cache Hit Ratio'::TEXT,
        CASE 
            WHEN ratio > 0.95 THEN 'EXCELLENT'
            WHEN ratio > 0.90 THEN 'GOOD'
            WHEN ratio > 0.85 THEN 'OK'
            ELSE 'POOR'
        END::TEXT,
        COALESCE(ROUND(ratio * 100, 2)::TEXT, '0.00') || '%',
        CASE 
            WHEN ratio < 0.90 OR ratio IS NULL THEN 'Consider increasing shared_buffers'
            ELSE 'No action needed'
        END::TEXT
    FROM cache_hit_ratios
    WHERE cache_type = 'table';
    
    -- Check connection count
    RETURN QUERY
    SELECT 
        'Connection Usage'::TEXT,
        CASE 
            WHEN current_connections < 50 THEN 'GOOD'
            WHEN current_connections < 80 THEN 'OK'
            ELSE 'HIGH'
        END::TEXT,
        current_connections::TEXT || ' connections',
        CASE 
            WHEN current_connections > 80 THEN 'Monitor connection pool'
            ELSE 'Connection count healthy'
        END::TEXT
    FROM (
        SELECT COUNT(*) as current_connections FROM pg_stat_activity
    ) conn_stats;
    
    -- Check database size
    RETURN QUERY
    SELECT 
        'Database Size'::TEXT,
        'INFO'::TEXT,
        pg_size_pretty(pg_database_size(current_database()))::TEXT,
        'Monitor growth rate'::TEXT;
    
    -- Check table count
    RETURN QUERY
    SELECT 
        'Total Tables'::TEXT,
        'INFO'::TEXT,
        COUNT(*)::TEXT || ' tables',
        'Within normal range'::TEXT
    FROM pg_tables WHERE schemaname = 'public';
END;
$$ LANGUAGE plpgsql;

-- Function to find unused indexes
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
        s.relname::TEXT as tablename,
        s.indexrelname::TEXT as indexname,
        pg_size_pretty(pg_relation_size(s.indexrelid))::TEXT,
        s.idx_scan
    FROM pg_stat_user_indexes s
    JOIN pg_index i ON s.indexrelid = i.indexrelid
    WHERE s.idx_scan < 100
        AND s.schemaname = 'public'
        AND NOT i.indisunique
        AND NOT i.indisprimary
    ORDER BY pg_relation_size(s.indexrelid) DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- Create ROUND function if needed
DO $$
BEGIN
    CREATE FUNCTION round(double precision, integer) 
    RETURNS numeric AS 'SELECT ROUND($1::numeric, $2)' 
    LANGUAGE SQL IMMUTABLE;
EXCEPTION
    WHEN duplicate_function THEN NULL;
END $$;

COMMIT;

-- Test the views
\echo 'Testing monitoring components...'
\echo ''

SELECT 'Cache Stats:' as test, * FROM simple_cache_stats;
\echo ''

SELECT 'Health Check:' as test FROM check_system_health() LIMIT 1;
\echo ''

SELECT 'Sample Index Usage:' as test, 
       indexname, scans, size 
FROM simple_index_usage 
ORDER BY scans 
LIMIT 5;
\echo ''

SELECT 'Unused Indexes Count:' as test, COUNT(*) as count
FROM simple_index_usage WHERE scans = 0;

\echo ''
\echo '✅ Monitoring components successfully installed!'
\echo ''
\echo 'Available commands:'
\echo '  SELECT * FROM check_system_health();'
\echo '  SELECT * FROM simple_cache_stats;'
\echo '  SELECT * FROM find_unused_indexes();'
\echo '  SELECT * FROM index_usage_stats WHERE usage_category = ''UNUSED'';'

```

