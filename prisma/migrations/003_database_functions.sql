-- migrations/003_database_functions.sql
-- Utility functions for Sparkle Universe

-- Function 1: Calculate user level based on experience
CREATE OR REPLACE FUNCTION calculate_user_level(experience_points INT)
RETURNS INT AS $$
DECLARE
    level INT;
BEGIN
    -- Level calculation formula: level = floor(sqrt(experience / 100))
    -- Ensures exponential difficulty increase
    level := FLOOR(SQRT(experience_points::NUMERIC / 100));
    
    -- Minimum level is 1
    RETURN GREATEST(level, 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function 2: Calculate engagement rate for a post
CREATE OR REPLACE FUNCTION calculate_engagement_rate(post_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    total_views INT;
    total_interactions INT;
    engagement_rate NUMERIC(5,4);
BEGIN
    -- Get view count
    SELECT COALESCE(ps.viewCount, 0) INTO total_views
    FROM posts p
    LEFT JOIN post_stats ps ON p.id = ps.postId
    WHERE p.id = post_id;
    
    -- Get interaction count (reactions + comments)
    SELECT 
        COALESCE(COUNT(DISTINCT r.id), 0) + COALESCE(COUNT(DISTINCT c.id), 0)
    INTO total_interactions
    FROM posts p
    LEFT JOIN reactions r ON p.id = r.postId
    LEFT JOIN comments c ON p.id = c.postId AND c.deleted = false
    WHERE p.id = post_id;
    
    -- Calculate engagement rate
    IF total_views > 0 THEN
        engagement_rate := (total_interactions::NUMERIC / total_views::NUMERIC);
    ELSE
        engagement_rate := 0;
    END IF;
    
    RETURN LEAST(engagement_rate, 1); -- Cap at 100%
END;
$$ LANGUAGE plpgsql STABLE;

-- Function 3: Update post statistics
CREATE OR REPLACE FUNCTION update_post_stats(post_id UUID)
RETURNS VOID AS $$
DECLARE
    stats RECORD;
BEGIN
    -- Calculate all stats in one query
    WITH post_metrics AS (
        SELECT 
            p.id,
            COUNT(DISTINCT CASE WHEN r.type = 'LIKE' THEN r.id END) as like_count,
            COUNT(DISTINCT CASE WHEN r.type = 'LOVE' THEN r.id END) as love_count,
            COUNT(DISTINCT CASE WHEN r.type = 'FIRE' THEN r.id END) as fire_count,
            COUNT(DISTINCT r.id) as total_reactions,
            COUNT(DISTINCT c.id) as comment_count,
            COUNT(DISTINCT b.id) as bookmark_count
        FROM posts p
        LEFT JOIN reactions r ON p.id = r.postId
        LEFT JOIN comments c ON p.id = c.postId AND c.deleted = false
        LEFT JOIN bookmarks b ON p.id = b.postId
        WHERE p.id = post_id
        GROUP BY p.id
    )
    SELECT * INTO stats FROM post_metrics;
    
    -- Update or insert post stats
    INSERT INTO post_stats (
        postId, likeCount, loveCount, fireCount, 
        totalReactionCount, commentCount, bookmarkCount,
        engagementRate, lastCalculatedAt
    )
    VALUES (
        post_id, 
        stats.like_count,
        stats.love_count,
        stats.fire_count,
        stats.total_reactions,
        stats.comment_count,
        stats.bookmark_count,
        calculate_engagement_rate(post_id),
        NOW()
    )
    ON CONFLICT (postId) DO UPDATE SET
        likeCount = EXCLUDED.likeCount,
        loveCount = EXCLUDED.loveCount,
        fireCount = EXCLUDED.fireCount,
        totalReactionCount = EXCLUDED.totalReactionCount,
        commentCount = EXCLUDED.commentCount,
        bookmarkCount = EXCLUDED.bookmarkCount,
        engagementRate = EXCLUDED.engagementRate,
        lastCalculatedAt = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function 4: Calculate user reputation score
CREATE OR REPLACE FUNCTION calculate_reputation_score(user_id UUID)
RETURNS INT AS $$
DECLARE
    reputation INT := 0;
    user_stats RECORD;
BEGIN
    -- Get user statistics
    SELECT 
        u.level,
        u.verified,
        us.totalPosts,
        us.totalLikesReceived,
        us.totalFollowers,
        us.contentQualityScore,
        COUNT(DISTINCT ua.id) as achievements_count
    INTO user_stats
    FROM users u
    LEFT JOIN user_stats us ON u.id = us.userId
    LEFT JOIN user_achievements ua ON u.id = ua.userId
    WHERE u.id = user_id
    GROUP BY u.id, u.level, u.verified, us.totalPosts, 
             us.totalLikesReceived, us.totalFollowers, us.contentQualityScore;
    
    -- Calculate reputation based on multiple factors
    reputation := 
        (user_stats.level * 100) +                           -- Level contribution
        (CASE WHEN user_stats.verified THEN 500 ELSE 0 END) + -- Verified bonus
        (user_stats.totalPosts * 10) +                       -- Content creation
        (user_stats.totalLikesReceived * 2) +                -- Content quality
        (user_stats.totalFollowers * 5) +                    -- Influence
        (user_stats.achievements_count * 50) +               -- Achievements
        (COALESCE(user_stats.contentQualityScore, 0) * 100); -- Quality score
    
    RETURN reputation;
END;
$$ LANGUAGE plpgsql STABLE;

-- Test the functions
SELECT calculate_user_level(0), calculate_user_level(100), calculate_user_level(10000);
