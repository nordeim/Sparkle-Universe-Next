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
