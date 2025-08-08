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
