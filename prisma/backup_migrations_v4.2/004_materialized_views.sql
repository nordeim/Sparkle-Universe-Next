-- migrations/004_materialized_views.sql
-- Materialized views for performance optimization

-- View 1: Trending Posts (refreshed hourly)
CREATE MATERIALIZED VIEW trending_posts AS
WITH post_metrics AS (
    SELECT 
        p.id,
        p.title,
        p.slug,
        p.authorId,
        p.authorName,
        p.coverImage,
        p.excerpt,
        p.publishedAt,
        COALESCE(ps.viewCount, 0) as views,
        COALESCE(ps.totalReactionCount, 0) as reactions,
        COALESCE(ps.commentCount, 0) as comments,
        COALESCE(ps.engagementRate, 0) as engagement,
        -- Trending score calculation
        (
            COALESCE(ps.viewCount, 0) * 0.1 +
            COALESCE(ps.totalReactionCount, 0) * 2 +
            COALESCE(ps.commentCount, 0) * 3 +
            COALESCE(ps.shareCount, 0) * 5
        ) * EXP(-0.1 * EXTRACT(EPOCH FROM (NOW() - p.publishedAt)) / 86400) as trending_score
    FROM posts p
    LEFT JOIN post_stats ps ON p.id = ps.postId
    WHERE p.published = true 
        AND p.deleted = false
        AND p.publishedAt > NOW() - INTERVAL '7 days'
)
SELECT 
    pm.*,
    u.username,
    u.image as authorImage,
    u.verified as authorVerified
FROM post_metrics pm
LEFT JOIN users u ON pm.authorId = u.id
ORDER BY trending_score DESC
LIMIT 100;

-- Create indexes on materialized view
CREATE INDEX idx_trending_posts_score ON trending_posts(trending_score DESC);
CREATE INDEX idx_trending_posts_author ON trending_posts(authorId);

-- View 2: Top Creators (refreshed daily)
CREATE MATERIALIZED VIEW top_creators AS
WITH creator_metrics AS (
    SELECT 
        u.id,
        u.username,
        u.image,
        u.bio,
        u.verified,
        u.level,
        COALESCE(us.totalFollowers, 0) as followers,
        COALESCE(us.totalPosts, 0) as posts,
        COALESCE(us.engagementRate, 0) as engagement,
        COALESCE(us.contentQualityScore, 0) as quality,
        calculate_reputation_score(u.id) as reputation,
        COUNT(DISTINCT p.id) FILTER (WHERE p.publishedAt > NOW() - INTERVAL '30 days') as recent_posts
    FROM users u
    LEFT JOIN user_stats us ON u.id = us.userId
    LEFT JOIN posts p ON u.id = p.authorId AND p.published = true AND p.deleted = false
    WHERE u.role IN ('CREATOR', 'VERIFIED_CREATOR')
        AND u.deleted = false
        AND u.status = 'ACTIVE'
    GROUP BY u.id, u.username, u.image, u.bio, u.verified, u.level,
             us.totalFollowers, us.totalPosts, us.engagementRate, us.contentQualityScore
)
SELECT * FROM creator_metrics
ORDER BY reputation DESC
LIMIT 500;

-- Create indexes
CREATE INDEX idx_top_creators_reputation ON top_creators(reputation DESC);
CREATE INDEX idx_top_creators_followers ON top_creators(followers DESC);

-- View 3: Active Groups (refreshed every 6 hours)
CREATE MATERIALIZED VIEW active_groups AS
WITH group_activity AS (
    SELECT 
        g.id,
        g.name,
        g.slug,
        g.description,
        g.icon,
        g.memberCount,
        g.visibility,
        g.isFeatured,
        COUNT(DISTINCT gp.id) FILTER (WHERE gp.createdAt > NOW() - INTERVAL '7 days') as recent_posts,
        COUNT(DISTINCT gm.userId) FILTER (WHERE gm.lastActiveAt > NOW() - INTERVAL '24 hours') as active_members,
        MAX(gp.createdAt) as last_post_at
    FROM groups g
    LEFT JOIN group_posts gp ON g.id = gp.groupId
    LEFT JOIN group_members gm ON g.id = gm.groupId
    WHERE g.deleted = false
        AND g.visibility = 'PUBLIC'
    GROUP BY g.id
)
SELECT 
    ga.*,
    (
        ga.memberCount * 0.3 +
        ga.recent_posts * 2 +
        ga.active_members * 1.5 +
        CASE WHEN ga.isFeatured THEN 100 ELSE 0 END
    ) as activity_score
FROM group_activity ga
ORDER BY activity_score DESC
LIMIT 200;

-- Create indexes
CREATE INDEX idx_active_groups_score ON active_groups(activity_score DESC);
CREATE INDEX idx_active_groups_visibility ON active_groups(visibility);

-- View 4: User Reputation Scores (refreshed daily)
CREATE VIEW user_reputation_scores AS
SELECT 
    u.id,
    u.username,
    u.role,
    u.level,
    calculate_reputation_score(u.id) as reputation_score,
    NOW() as calculated_at
FROM users u
WHERE u.deleted = false
    AND u.status = 'ACTIVE';

-- Create refresh function for materialized views
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY trending_posts;
    REFRESH MATERIALIZED VIEW CONCURRENTLY top_creators;
    REFRESH MATERIALIZED VIEW CONCURRENTLY active_groups;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT ON trending_posts TO sparkle_app;
GRANT SELECT ON top_creators TO sparkle_app;
GRANT SELECT ON active_groups TO sparkle_app;
GRANT SELECT ON user_reputation_scores TO sparkle_app;
