# Comprehensive Database Implementation Plan for Sparkle Universe

## Executive Summary

After deep analysis of the database implementation notes, I've identified **9 major categories** encompassing **35+ specific implementations** that require SQL migrations and database-level optimizations. This plan provides a systematic approach to implement these features while maintaining system stability and performance.

## Phase-Based Implementation Strategy

### 🎯 Implementation Priorities

| Priority | Category | Risk | Impact | Dependencies |
|----------|----------|------|--------|--------------|
| P0 | Database Extensions | Low | High | None |
| P1 | JSON GIN Indexes | Low | High | Extensions |
| P2 | Database Functions | Low | Medium | None |
| P3 | Materialized Views | Medium | High | Functions |
| P4 | Database Triggers | High | High | Functions |
| P5 | Full-text Search | Medium | High | Extensions |
| P6 | Table Partitioning | High | High | Planning |
| P7 | Advanced Indexes | Low | Medium | Analysis |
| P8 | Monitoring Setup | Low | High | All above |

---

## Phase 1: Database Extensions Setup (Week 1)

### Objective: Enable required PostgreSQL extensions

### Implementation Checklist:

- [ ] Create migration file: `001_enable_extensions.sql`
- [ ] Enable pg_trgm extension
- [ ] Enable pgcrypto extension  
- [ ] Enable uuid-ossp extension
- [ ] Verify extensions are active
- [ ] Document extension usage

### SQL Implementation:

```sql
-- migrations/001_enable_extensions.sql
-- Enable required PostgreSQL extensions for Sparkle Universe v4.2
-- Updated to include monitoring extensions
-- Run with: psql -U postgres -d sparkle_db -f 001_enable_extensions.sql

BEGIN;

-- Enable pg_trgm for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Enable pgcrypto for encryption functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enable uuid-ossp for UUID generation (if not using gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_stat_statements for query performance monitoring (CRITICAL)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Configure pg_stat_statements
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET pg_stat_statements.track = 'all';
ALTER SYSTEM SET pg_stat_statements.max = 10000;

-- Verify extensions
SELECT 
    extname AS extension_name,
    extversion AS version,
    extnamespace::regnamespace AS schema
FROM pg_extension
WHERE extname IN ('pg_trgm', 'pgcrypto', 'uuid-ossp', 'pg_stat_statements')
ORDER BY extname;

COMMIT;

-- Note: Server restart required for pg_stat_statements
-- Run: SELECT pg_reload_conf(); after restart
```

---

## Phase 2: JSON Performance Indexes (Week 1)

### Objective: Create GIN indexes for JSON columns

### Implementation Checklist:

- [ ] Analyze JSON query patterns
- [ ] Create migration file: `002_json_gin_indexes.sql`
- [ ] Implement 7 GIN indexes
- [ ] Add 2 specific path indexes
- [ ] Test query performance
- [ ] Monitor index usage

### SQL Implementation:

```sql
-- migrations/002_json_gin_indexes.sql
-- JSON GIN indexes for improved query performance
-- Updated for v4.2 schema with correct JSON fields

BEGIN;

-- Profile JSON indexes (v4.2 extracted some fields)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profile_theme_preference 
ON profiles USING GIN (themePreference)
WHERE themePreference IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profile_notification_settings 
ON profiles USING GIN (notificationSettings);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profile_privacy_settings 
ON profiles USING GIN (privacySettings);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profile_social_links 
ON profiles USING GIN (socialLinks)
WHERE socialLinks IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profile_youtube_channel_data 
ON profiles USING GIN (youtubeChannelData)
WHERE youtubeChannelData IS NOT NULL;

-- Post content and metadata
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_content 
ON posts USING GIN (content);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_sponsor_info 
ON posts USING GIN (sponsorInfo)
WHERE sponsorInfo IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_youtube_video_data 
ON posts USING GIN (youtubeVideoData)
WHERE youtubeVideoData IS NOT NULL;

-- Group settings and guidelines
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_guidelines 
ON groups USING GIN (guidelines)
WHERE guidelines IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_settings 
ON groups USING GIN (settings);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_custom_emojis 
ON groups USING GIN (customEmojis)
WHERE customEmojis IS NOT NULL;

-- Event complex fields
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_agenda 
ON events USING GIN (agenda)
WHERE agenda IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_location_coords 
ON events USING GIN (locationCoords)
WHERE locationCoords IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_recurrence 
ON events USING GIN (recurrence)
WHERE recurrence IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_speakers 
ON events USING GIN (speakers)
WHERE speakers IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_sponsors 
ON events USING GIN (sponsors)
WHERE sponsors IS NOT NULL;

-- Trade items
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trade_initiator_items 
ON trades USING GIN (initiatorItems);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trade_recipient_items 
ON trades USING GIN (recipientItems);

-- Quest requirements and rewards
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quest_requirements 
ON quests USING GIN (requirements);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quest_rewards 
ON quests USING GIN (rewards);

-- User AI preferences
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_ai_content_preferences 
ON user_ai_preferences USING GIN (contentPreferences);

-- Specific JSON path indexes for frequent queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_content_type 
ON posts ((content->>'type'))
WHERE content IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profile_notification_language 
ON profiles ((notificationSettings->>'language'))
WHERE notificationSettings IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_settings_max_members 
ON groups ((settings->>'maxMembers'))
WHERE settings IS NOT NULL;

-- Verify indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size
FROM pg_indexes
WHERE indexname LIKE 'idx_%'
    AND indexname LIKE '%json%' OR indexname LIKE '%gin%'
ORDER BY tablename, indexname;

COMMIT;
```

---

## Phase 3: Database Functions (Week 2)

### Objective: Create utility functions for calculations

### Implementation Checklist:

- [ ] Create migration file: `003_database_functions.sql`
- [ ] Implement calculate_user_level function
- [ ] Implement calculate_engagement_rate function
- [ ] Implement update_post_stats function
- [ ] Implement calculate_reputation_score function
- [ ] Create unit tests for each function
- [ ] Document function usage

### SQL Implementation:

```sql
-- migrations/003_database_functions.sql
-- Utility functions for Sparkle Universe v4.2
-- CRITICAL UPDATES: Fixed level calculation, reputation score, added soft delete check

BEGIN;

-- Function 1: Calculate user level based on level_configs table
CREATE OR REPLACE FUNCTION calculate_user_level(experience_points INT)
RETURNS INT AS $$
DECLARE
    target_level INT;
BEGIN
    -- Use level_configs table for accurate progression
    SELECT level INTO target_level
    FROM level_configs
    WHERE requiredXp <= experience_points
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
    -- Get view count from post_stats
    SELECT COALESCE(ps.viewCount, 0) INTO total_views
    FROM posts p
    LEFT JOIN post_stats ps ON p.id = ps.postId
    WHERE p.id = post_id;
    
    -- Get interaction count (reactions + comments + shares + bookmarks)
    SELECT 
        COALESCE(COUNT(DISTINCT r.id), 0) + 
        COALESCE(COUNT(DISTINCT c.id) FILTER (WHERE c.deleted = false), 0) +
        COALESCE(ps.shareCount, 0) +
        COALESCE(COUNT(DISTINCT b.id), 0)
    INTO total_interactions
    FROM posts p
    LEFT JOIN post_stats ps ON p.id = ps.postId
    LEFT JOIN reactions r ON p.id = r.postId
    LEFT JOIN comments c ON p.id = c.postId
    LEFT JOIN bookmarks b ON p.id = b.postId
    WHERE p.id = post_id
    GROUP BY ps.shareCount;
    
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
    -- Calculate all stats in one query
    WITH post_metrics AS (
        SELECT 
            p.id,
            COUNT(DISTINCT vh.id) as view_count,
            COUNT(DISTINCT vh.userId) as unique_view_count,
            COUNT(DISTINCT CASE WHEN r.type = 'LIKE' THEN r.id END) as like_count,
            COUNT(DISTINCT CASE WHEN r.type = 'LOVE' THEN r.id END) as love_count,
            COUNT(DISTINCT CASE WHEN r.type = 'FIRE' THEN r.id END) as fire_count,
            COUNT(DISTINCT r.id) as total_reactions,
            COUNT(DISTINCT c.id) FILTER (WHERE c.deleted = false) as comment_count,
            COUNT(DISTINCT b.id) as bookmark_count,
            AVG(vh.viewDuration) FILTER (WHERE vh.viewDuration > 0) as avg_read_time
        FROM posts p
        LEFT JOIN view_history vh ON p.id = vh.postId
        LEFT JOIN reactions r ON p.id = r.postId
        LEFT JOIN comments c ON p.id = c.postId
        LEFT JOIN bookmarks b ON p.id = b.postId
        WHERE p.id = post_id
        GROUP BY p.id
    )
    SELECT * INTO stats FROM post_metrics;
    
    -- Calculate engagement rate
    engagement := calculate_engagement_rate(post_id);
    
    -- Update or insert post stats
    INSERT INTO post_stats (
        postId, viewCount, uniqueViewCount, likeCount, loveCount, fireCount, 
        totalReactionCount, commentCount, bookmarkCount, avgReadTime,
        engagementRate, lastCalculatedAt
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
    ON CONFLICT (postId) DO UPDATE SET
        viewCount = EXCLUDED.viewCount,
        uniqueViewCount = EXCLUDED.uniqueViewCount,
        likeCount = EXCLUDED.likeCount,
        loveCount = EXCLUDED.loveCount,
        fireCount = EXCLUDED.fireCount,
        totalReactionCount = EXCLUDED.totalReactionCount,
        commentCount = EXCLUDED.commentCount,
        bookmarkCount = EXCLUDED.bookmarkCount,
        avgReadTime = EXCLUDED.avgReadTime,
        engagementRate = EXCLUDED.engagementRate,
        lastCalculatedAt = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function 4: Calculate user reputation score (FIXED)
CREATE OR REPLACE FUNCTION calculate_reputation_score(user_id UUID)
RETURNS INT AS $$
DECLARE
    reputation INT := 0;
    user_stats RECORD;
BEGIN
    -- Get comprehensive user statistics
    SELECT 
        u.level,
        u.verified,
        u.role,
        u.reputationScore as base_reputation,
        COALESCE(u.totalRevenueEarned::INT / 1000, 0) as revenue_score,
        us.totalPosts,
        us.totalLikesReceived,
        us.totalFollowers,
        us.contentQualityScore,
        COUNT(DISTINCT ua.id) FILTER (WHERE ua.deleted = false) as achievements_count,
        COUNT(DISTINCT p.id) FILTER (WHERE p.featured = true) as featured_posts
    INTO user_stats
    FROM users u
    LEFT JOIN user_stats us ON u.id = us.userId
    LEFT JOIN user_achievements ua ON u.id = ua.userId
    LEFT JOIN posts p ON u.id = p.authorId AND p.deleted = false
    WHERE u.id = user_id
    GROUP BY u.id, u.level, u.verified, u.role, u.reputationScore, 
             u.totalRevenueEarned, us.totalPosts, us.totalLikesReceived, 
             us.totalFollowers, us.contentQualityScore;
    
    -- Calculate reputation based on multiple factors
    reputation := 
        COALESCE(user_stats.base_reputation, 0) +                    -- Base reputation
        (user_stats.level * 100) +                                   -- Level contribution
        (CASE WHEN user_stats.verified THEN 500 ELSE 0 END) +       -- Verified bonus
        (CASE 
            WHEN user_stats.role = 'VERIFIED_CREATOR' THEN 1000
            WHEN user_stats.role = 'CREATOR' THEN 500
            ELSE 0
        END) +                                                        -- Role bonus
        (LEAST(user_stats.totalPosts, 100) * 10) +                  -- Content creation (capped)
        (LEAST(user_stats.totalLikesReceived, 1000) * 2) +          -- Content quality (capped)
        (LEAST(user_stats.totalFollowers, 10000) * 1) +             -- Influence (capped)
        (user_stats.achievements_count * 50) +                       -- Achievements
        (user_stats.featured_posts * 200) +                          -- Featured content
        (COALESCE(user_stats.contentQualityScore, 0) * 100) +       -- Quality score
        user_stats.revenue_score;                                     -- Creator revenue
    
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
        'SELECT (deleted = false OR deletedAt IS NOT NULL) 
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
        WHERE ua.userId = user_id 
        AND ua.achievementId = achievement.id
        AND ua.deleted = false
    ) THEN
        RETURN false;
    END IF;
    
    -- Get user data for criteria checking
    SELECT 
        u.*,
        us.totalPosts,
        us.totalFollowers,
        us.streakDays
    INTO user_data
    FROM users u
    LEFT JOIN user_stats us ON u.id = us.userId
    WHERE u.id = user_id;
    
    -- Check criteria based on achievement code
    CASE achievement_code
        WHEN 'FIRST_POST' THEN
            is_eligible := user_data.totalPosts >= 1;
        WHEN 'PROLIFIC_WRITER' THEN
            is_eligible := user_data.totalPosts >= 50;
        WHEN 'SOCIAL_BUTTERFLY' THEN
            is_eligible := user_data.totalFollowers >= 100;
        WHEN 'STREAK_WEEK' THEN
            is_eligible := user_data.streakDays >= 7;
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

-- Test the functions
DO $$
BEGIN
    RAISE NOTICE 'Testing calculate_user_level: % (should be 1)', calculate_user_level(0);
    RAISE NOTICE 'Testing calculate_user_level: % (should match level_configs)', calculate_user_level(1000);
END $$;

COMMIT;
```

---

## Phase 4: Materialized Views (Week 2)

### Objective: Create materialized views for performance

### Implementation Checklist:

- [ ] Create migration file: `004_materialized_views.sql`
- [ ] Implement trending_posts view
- [ ] Implement top_creators view
- [ ] Implement active_groups view
- [ ] Implement user_reputation_scores view
- [ ] Create refresh strategy
- [ ] Schedule automatic refreshes

### SQL Implementation:

```sql
-- migrations/004_materialized_views.sql
-- Materialized views for performance optimization
-- Updated with correct field references for v4.2

BEGIN;

-- View 1: Trending Posts (refreshed hourly)
DROP MATERIALIZED VIEW IF EXISTS trending_posts CASCADE;
CREATE MATERIALIZED VIEW trending_posts AS
WITH post_metrics AS (
    SELECT 
        p.id,
        p.title,
        p.slug,
        p.authorId,
        COALESCE(u.username, p.authorName) as authorName,
        p.coverImage,
        p.excerpt,
        p.publishedAt,
        p.views,
        COALESCE(ps.viewCount, p.views, 0) as total_views,
        COALESCE(ps.totalReactionCount, 0) as reactions,
        COALESCE(ps.commentCount, 0) as comments,
        COALESCE(ps.shareCount, 0) as shares,
        COALESCE(ps.engagementRate, 0) as engagement,
        -- Enhanced trending score with time decay
        (
            COALESCE(ps.viewCount, p.views, 0) * 0.1 +
            COALESCE(ps.totalReactionCount, 0) * 2 +
            COALESCE(ps.commentCount, 0) * 3 +
            COALESCE(ps.shareCount, 0) * 5 +
            COALESCE(ps.bookmarkCount, 0) * 4
        ) * EXP(-0.1 * EXTRACT(EPOCH FROM (NOW() - p.publishedAt)) / 86400) as trending_score
    FROM posts p
    LEFT JOIN post_stats ps ON p.id = ps.postId
    LEFT JOIN users u ON p.authorId = u.id
    WHERE p.published = true 
        AND p.deleted = false
        AND p.publishedAt > NOW() - INTERVAL '7 days'
        AND p.moderationStatus IN ('APPROVED', 'AUTO_APPROVED')
)
SELECT 
    pm.*,
    u.image as authorImage,
    u.verified as authorVerified,
    c.name as categoryName,
    c.slug as categorySlug
FROM post_metrics pm
LEFT JOIN users u ON pm.authorId = u.id
LEFT JOIN categories c ON pm.id IN (SELECT id FROM posts WHERE categoryId = c.id)
WHERE trending_score > 0
ORDER BY trending_score DESC
LIMIT 100;

-- Create indexes on materialized view
CREATE UNIQUE INDEX idx_trending_posts_id ON trending_posts(id);
CREATE INDEX idx_trending_posts_score ON trending_posts(trending_score DESC);
CREATE INDEX idx_trending_posts_author ON trending_posts(authorId) WHERE authorId IS NOT NULL;

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
        u.creatorRevenueShare,
        u.totalRevenueEarned,
        COALESCE(us.totalFollowers, 0) as followers,
        COALESCE(us.totalPosts, 0) as posts,
        COALESCE(us.engagementRate, 0) as engagement,
        COALESCE(us.contentQualityScore, 0) as quality,
        calculate_reputation_score(u.id) as reputation,
        COUNT(DISTINCT p.id) FILTER (WHERE p.publishedAt > NOW() - INTERVAL '30 days') as recent_posts,
        COUNT(DISTINCT p.id) FILTER (WHERE p.featured = true) as featured_posts,
        COUNT(DISTINCT ua.id) FILTER (WHERE ua.deleted = false) as achievements
    FROM users u
    LEFT JOIN user_stats us ON u.id = us.userId
    LEFT JOIN posts p ON u.id = p.authorId AND p.published = true AND p.deleted = false
    LEFT JOIN user_achievements ua ON u.id = ua.userId
    WHERE u.role IN ('CREATOR', 'VERIFIED_CREATOR')
        AND u.deleted = false
        AND u.status = 'ACTIVE'
    GROUP BY u.id, us.totalFollowers, us.totalPosts, us.engagementRate, us.contentQualityScore
)
SELECT 
    cm.*,
    CASE 
        WHEN cm.totalRevenueEarned > 100000 THEN 'platinum'
        WHEN cm.totalRevenueEarned > 10000 THEN 'gold'
        WHEN cm.totalRevenueEarned > 1000 THEN 'silver'
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
        g.coverImage,
        g.memberCount,
        g.visibility,
        g.isFeatured,
        g.isVerified,
        g.autoApproveMembers,
        g.requirePostApproval,
        COUNT(DISTINCT gp.id) FILTER (WHERE gp.createdAt > NOW() - INTERVAL '7 days') as recent_posts,
        COUNT(DISTINCT gm.userId) FILTER (WHERE gm.lastActiveAt > NOW() - INTERVAL '24 hours') as active_members,
        MAX(gp.createdAt) as last_post_at,
        AVG(gp.reactionCount) as avg_post_engagement
    FROM groups g
    LEFT JOIN group_posts gp ON g.id = gp.groupId
    LEFT JOIN group_members gm ON g.id = gm.groupId
    WHERE g.deleted = false
        AND g.visibility IN ('PUBLIC', 'PRIVATE')
    GROUP BY g.id
)
SELECT 
    ga.*,
    (
        ga.memberCount * 0.3 +
        ga.recent_posts * 2 +
        ga.active_members * 1.5 +
        COALESCE(ga.avg_post_engagement, 0) * 10 +
        CASE WHEN ga.isFeatured THEN 100 ELSE 0 END +
        CASE WHEN ga.isVerified THEN 50 ELSE 0 END
    ) as activity_score
FROM group_activity ga
WHERE ga.memberCount > 0
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
    
    -- Log refresh
    INSERT INTO system_logs (action, details, created_at)
    VALUES ('materialized_view_refresh', 
            jsonb_build_object('views', ARRAY['trending_posts', 'top_creators', 'active_groups']),
            NOW());
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT ON trending_posts TO PUBLIC;
GRANT SELECT ON top_creators TO PUBLIC;
GRANT SELECT ON active_groups TO PUBLIC;
GRANT SELECT ON user_reputation_scores TO PUBLIC;

COMMIT;
```

---

## Phase 5: Database Triggers (Week 3)

### Objective: Implement automatic data maintenance triggers

### Implementation Checklist:

- [ ] Create migration file: `005_database_triggers.sql`
- [ ] Implement timestamp triggers
- [ ] Implement denormalized count triggers
- [ ] Implement level progression triggers
- [ ] Implement achievement progress triggers
- [ ] Test trigger cascades
- [ ] Monitor trigger performance

### SQL Implementation:

```sql
-- migrations/005_database_triggers.sql
-- Database triggers for automatic data maintenance
-- CRITICAL: Added comprehensive soft delete and achievement triggers

BEGIN;

-- =====================================================
-- SOFT DELETE ENFORCEMENT (CRITICAL)
-- =====================================================

-- Universal soft delete enforcement function
CREATE OR REPLACE FUNCTION enforce_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- When marking as deleted, ensure deletedAt is set
    IF NEW.deleted = true AND OLD.deleted = false THEN
        NEW.deletedAt := NOW();
        
        -- Set deletedBy if we have user context (would need to be passed via session)
        -- This would typically be set at the application layer
        -- NEW.deletedBy := current_setting('app.current_user_id', true);
    END IF;
    
    -- When unmarking as deleted, clear deletion fields
    IF NEW.deleted = false AND OLD.deleted = true THEN
        NEW.deletedAt := NULL;
        NEW.deletedBy := NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply soft delete triggers to ALL tables with the pattern
CREATE TRIGGER enforce_soft_delete_users
BEFORE UPDATE OF deleted ON users
FOR EACH ROW EXECUTE FUNCTION enforce_soft_delete();

CREATE TRIGGER enforce_soft_delete_categories
BEFORE UPDATE OF deleted ON categories
FOR EACH ROW EXECUTE FUNCTION enforce_soft_delete();

CREATE TRIGGER enforce_soft_delete_posts
BEFORE UPDATE OF deleted ON posts
FOR EACH ROW EXECUTE FUNCTION enforce_soft_delete();

CREATE TRIGGER enforce_soft_delete_post_series
BEFORE UPDATE OF deleted ON post_series
FOR EACH ROW EXECUTE FUNCTION enforce_soft_delete();

CREATE TRIGGER enforce_soft_delete_tags
BEFORE UPDATE OF deleted ON tags
FOR EACH ROW EXECUTE FUNCTION enforce_soft_delete();

CREATE TRIGGER enforce_soft_delete_comments
BEFORE UPDATE OF deleted ON comments
FOR EACH ROW EXECUTE FUNCTION enforce_soft_delete();

CREATE TRIGGER enforce_soft_delete_polls
BEFORE UPDATE OF deleted ON polls
FOR EACH ROW EXECUTE FUNCTION enforce_soft_delete();

CREATE TRIGGER enforce_soft_delete_achievements
BEFORE UPDATE OF deleted ON achievements
FOR EACH ROW EXECUTE FUNCTION enforce_soft_delete();

CREATE TRIGGER enforce_soft_delete_user_achievements
BEFORE UPDATE OF deleted ON user_achievements
FOR EACH ROW EXECUTE FUNCTION enforce_soft_delete();

CREATE TRIGGER enforce_soft_delete_trades
BEFORE UPDATE OF deleted ON trades
FOR EACH ROW EXECUTE FUNCTION enforce_soft_delete();

CREATE TRIGGER enforce_soft_delete_youtube_channels
BEFORE UPDATE OF deleted ON youtube_channels
FOR EACH ROW EXECUTE FUNCTION enforce_soft_delete();

CREATE TRIGGER enforce_soft_delete_watch_parties
BEFORE UPDATE OF deleted ON watch_parties
FOR EACH ROW EXECUTE FUNCTION enforce_soft_delete();

CREATE TRIGGER enforce_soft_delete_groups
BEFORE UPDATE OF deleted ON groups
FOR EACH ROW EXECUTE FUNCTION enforce_soft_delete();

CREATE TRIGGER enforce_soft_delete_events
BEFORE UPDATE OF deleted ON events
FOR EACH ROW EXECUTE FUNCTION enforce_soft_delete();

CREATE TRIGGER enforce_soft_delete_conversations
BEFORE UPDATE OF deleted ON conversations
FOR EACH ROW EXECUTE FUNCTION enforce_soft_delete();

CREATE TRIGGER enforce_soft_delete_messages
BEFORE UPDATE OF deleted ON messages
FOR EACH ROW EXECUTE FUNCTION enforce_soft_delete();

CREATE TRIGGER enforce_soft_delete_chat_messages
BEFORE UPDATE OF deleted ON chat_messages
FOR EACH ROW EXECUTE FUNCTION enforce_soft_delete();

CREATE TRIGGER enforce_soft_delete_reports
BEFORE UPDATE OF deleted ON reports
FOR EACH ROW EXECUTE FUNCTION enforce_soft_delete();

CREATE TRIGGER enforce_soft_delete_watch_party_chat
BEFORE UPDATE OF deleted ON watch_party_chat
FOR EACH ROW EXECUTE FUNCTION enforce_soft_delete();

-- =====================================================
-- TIMESTAMP MANAGEMENT
-- =====================================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updatedAt
CREATE TRIGGER update_updated_at_users BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_updated_at_posts BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_updated_at_profiles BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Continue for all tables with updatedAt...

-- =====================================================
-- DENORMALIZED COUNT MAINTENANCE
-- =====================================================

-- Update user post count
CREATE OR REPLACE FUNCTION update_user_post_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.published = true THEN
        UPDATE user_stats 
        SET totalPosts = totalPosts + 1,
            lastActivityAt = NOW()
        WHERE userId = NEW.authorId;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle publish/unpublish
        IF OLD.published = false AND NEW.published = true THEN
            UPDATE user_stats 
            SET totalPosts = totalPosts + 1,
                lastActivityAt = NOW()
            WHERE userId = NEW.authorId;
        ELSIF OLD.published = true AND NEW.published = false THEN
            UPDATE user_stats 
            SET totalPosts = GREATEST(totalPosts - 1, 0)
            WHERE userId = NEW.authorId;
        END IF;
    ELSIF TG_OP = 'DELETE' AND OLD.published = true THEN
        UPDATE user_stats 
        SET totalPosts = GREATEST(totalPosts - 1, 0)
        WHERE userId = OLD.authorId;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER maintain_user_post_count
AFTER INSERT OR UPDATE OR DELETE ON posts
FOR EACH ROW 
EXECUTE FUNCTION update_user_post_count();

-- Update follower counts
CREATE OR REPLACE FUNCTION update_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update follower count for followed user
        UPDATE user_stats 
        SET totalFollowers = totalFollowers + 1
        WHERE userId = NEW.followingId;
        
        -- Update following count for follower
        UPDATE user_stats 
        SET totalFollowing = totalFollowing + 1
        WHERE userId = NEW.followerId;
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Update follower count for unfollowed user
        UPDATE user_stats 
        SET totalFollowers = GREATEST(totalFollowers - 1, 0)
        WHERE userId = OLD.followingId;
        
        -- Update following count for unfollower
        UPDATE user_stats 
        SET totalFollowing = GREATEST(totalFollowing - 1, 0)
        WHERE userId = OLD.followerId;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER maintain_follower_counts
AFTER INSERT OR DELETE ON follows
FOR EACH ROW 
EXECUTE FUNCTION update_follower_counts();

-- =====================================================
-- LEVEL PROGRESSION (FIXED)
-- =====================================================

CREATE OR REPLACE FUNCTION check_user_level_progression()
RETURNS TRIGGER AS $$
DECLARE
    new_level INT;
    current_level INT;
    level_data RECORD;
BEGIN
    -- Only process if experience changed
    IF NEW.experience = OLD.experience THEN
        RETURN NEW;
    END IF;
    
    -- Calculate new level using level_configs
    new_level := calculate_user_level(NEW.experience);
    current_level := OLD.level;
    
    -- Update level if changed
    IF new_level > current_level THEN
        NEW.level := new_level;
        
        -- Get level rewards
        SELECT * INTO level_data
        FROM level_configs
        WHERE level = new_level;
        
        -- Create level up notification
        INSERT INTO notifications (
            id, type, userId, title, message, 
            priority, createdAt
        ) VALUES (
            gen_random_uuid(),
            'LEVEL_UP', 
            NEW.id,
            'Level Up! You reached level ' || new_level || '!',
            'Congratulations! You are now a ' || COALESCE(level_data.title, 'Level ' || new_level) || '!',
            1,
            NOW()
        );
        
        -- Award level rewards
        IF level_data.sparkleReward > 0 THEN
            UPDATE user_balances
            SET sparklePoints = sparklePoints + level_data.sparkleReward,
                lifetimeEarned = lifetimeEarned + level_data.sparkleReward
            WHERE userId = NEW.id;
            
            -- Log currency transaction
            INSERT INTO currency_transactions (
                id, userId, amount, currencyType, transactionType,
                source, description, balanceBefore, balanceAfter, createdAt
            ) VALUES (
                gen_random_uuid(),
                NEW.id,
                level_data.sparkleReward,
                'sparkle',
                'earn',
                'level_up',
                'Level ' || new_level || ' reward',
                (SELECT sparklePoints - level_data.sparkleReward FROM user_balances WHERE userId = NEW.id),
                (SELECT sparklePoints FROM user_balances WHERE userId = NEW.id),
                NOW()
            );
        END IF;
        
        -- Log XP event
        INSERT INTO xp_logs (
            id, userId, amount, source, reason, 
            totalXp, createdAt
        ) VALUES (
            gen_random_uuid(),
            NEW.id,
            NEW.experience - OLD.experience,
            'level_up',
            'Reached level ' || new_level,
            NEW.experience,
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_level_progression
BEFORE UPDATE OF experience ON users
FOR EACH ROW
WHEN (NEW.experience != OLD.experience)
EXECUTE FUNCTION check_user_level_progression();

-- =====================================================
-- COMPREHENSIVE ACHIEVEMENT SYSTEM
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
            IF check_achievement_eligibility(NEW.authorId, 'FIRST_POST') THEN
                PERFORM grant_achievement(NEW.authorId, 'FIRST_POST');
            END IF;
            
            -- Check prolific writer (50 posts)
            SELECT totalPosts INTO user_data FROM user_stats WHERE userId = NEW.authorId;
            IF user_data.totalPosts >= 50 AND check_achievement_eligibility(NEW.authorId, 'PROLIFIC_WRITER') THEN
                PERFORM grant_achievement(NEW.authorId, 'PROLIFIC_WRITER');
            END IF;
        END IF;
        
    ELSIF TG_TABLE_NAME = 'follows' THEN
        -- Social achievements
        IF TG_OP = 'INSERT' THEN
            SELECT totalFollowers INTO user_data FROM user_stats WHERE userId = NEW.followingId;
            
            -- First follower
            IF user_data.totalFollowers = 1 AND check_achievement_eligibility(NEW.followingId, 'FIRST_FOLLOWER') THEN
                PERFORM grant_achievement(NEW.followingId, 'FIRST_FOLLOWER');
            END IF;
            
            -- Social butterfly (100 followers)
            IF user_data.totalFollowers >= 100 AND check_achievement_eligibility(NEW.followingId, 'SOCIAL_BUTTERFLY') THEN
                PERFORM grant_achievement(NEW.followingId, 'SOCIAL_BUTTERFLY');
            END IF;
            
            -- Influencer (1000 followers)
            IF user_data.totalFollowers >= 1000 AND check_achievement_eligibility(NEW.followingId, 'INFLUENCER') THEN
                PERFORM grant_achievement(NEW.followingId, 'INFLUENCER');
            END IF;
        END IF;
        
    ELSIF TG_TABLE_NAME = 'user_stats' THEN
        -- Streak achievements
        IF NEW.streakDays >= 7 AND OLD.streakDays < 7 THEN
            IF check_achievement_eligibility(NEW.userId, 'STREAK_WEEK') THEN
                PERFORM grant_achievement(NEW.userId, 'STREAK_WEEK');
            END IF;
        END IF;
        
        IF NEW.streakDays >= 30 AND OLD.streakDays < 30 THEN
            IF check_achievement_eligibility(NEW.userId, 'STREAK_MONTH') THEN
                PERFORM grant_achievement(NEW.userId, 'STREAK_MONTH');
            END IF;
        END IF;
        
    ELSIF TG_TABLE_NAME = 'reactions' THEN
        -- Engagement achievements
        IF TG_OP = 'INSERT' AND NEW.postId IS NOT NULL THEN
            -- Get post author
            SELECT authorId INTO user_data FROM posts WHERE id = NEW.postId;
            
            -- Update total likes received
            UPDATE user_stats 
            SET totalLikesReceived = totalLikesReceived + 1
            WHERE userId = user_data.authorId;
            
            -- Check likes milestones
            SELECT totalLikesReceived INTO user_data FROM user_stats WHERE userId = user_data.authorId;
            
            IF user_data.totalLikesReceived >= 100 AND check_achievement_eligibility(user_data.authorId, 'WELL_LIKED') THEN
                PERFORM grant_achievement(user_data.authorId, 'WELL_LIKED');
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Helper function to grant achievements
CREATE OR REPLACE FUNCTION grant_achievement(
    p_user_id UUID,
    p_achievement_code TEXT
)
RETURNS VOID AS $$
DECLARE
    achievement RECORD;
BEGIN
    -- Get achievement details
    SELECT * INTO achievement
    FROM achievements
    WHERE code = p_achievement_code AND deleted = false;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Grant achievement
    INSERT INTO user_achievements (
        id, userId, achievementId, progress,
        unlockedAt, notified, claimedRewards
    ) VALUES (
        gen_random_uuid(),
        p_user_id,
        achievement.id,
        1.0,
        NOW(),
        false,
        false
    )
    ON CONFLICT (userId, achievementId) DO NOTHING;
    
    -- Create notification
    INSERT INTO notifications (
        id, type, userId, entityId, entityType,
        title, message, priority, imageUrl, createdAt
    ) VALUES (
        gen_random_uuid(),
        'ACHIEVEMENT_UNLOCKED',
        p_user_id,
        achievement.id,
        'achievement',
        'Achievement Unlocked!',
        'You unlocked: ' || achievement.name || COALESCE(' - ' || achievement.shortDescription, ''),
        1,
        achievement.icon,
        NOW()
    );
    
    -- Award XP if specified
    IF achievement.xpReward > 0 THEN
        UPDATE users
        SET experience = experience + achievement.xpReward
        WHERE id = p_user_id;
    END IF;
    
    -- Award currency if specified
    IF achievement.sparklePointsReward > 0 THEN
        UPDATE user_balances
        SET sparklePoints = sparklePoints + achievement.sparklePointsReward,
            lifetimeEarned = lifetimeEarned + achievement.sparklePointsReward
        WHERE userId = p_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Apply achievement triggers
CREATE TRIGGER track_post_achievements
AFTER INSERT ON posts
FOR EACH ROW
WHEN (NEW.published = true)
EXECUTE FUNCTION track_achievement_progress();

CREATE TRIGGER track_follow_achievements
AFTER INSERT ON follows
FOR EACH ROW
EXECUTE FUNCTION track_achievement_progress();

CREATE TRIGGER track_streak_achievements
AFTER UPDATE OF streakDays ON user_stats
FOR EACH ROW
EXECUTE FUNCTION track_achievement_progress();

CREATE TRIGGER track_reaction_achievements
AFTER INSERT ON reactions
FOR EACH ROW
EXECUTE FUNCTION track_achievement_progress();

-- =====================================================
-- POST STATS MAINTENANCE
-- =====================================================

CREATE OR REPLACE FUNCTION maintain_post_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update post stats when reactions change
    IF TG_TABLE_NAME = 'reactions' THEN
        IF TG_OP IN ('INSERT', 'DELETE') THEN
            PERFORM update_post_stats(COALESCE(NEW.postId, OLD.postId));
        END IF;
        
    -- Update post stats when comments change
    ELSIF TG_TABLE_NAME = 'comments' THEN
        IF TG_OP IN ('INSERT', 'DELETE', 'UPDATE') THEN
            PERFORM update_post_stats(COALESCE(NEW.postId, OLD.postId));
        END IF;
        
    -- Update post stats when bookmarks change
    ELSIF TG_TABLE_NAME = 'bookmarks' THEN
        IF TG_OP IN ('INSERT', 'DELETE') THEN
            PERFORM update_post_stats(COALESCE(NEW.postId, OLD.postId));
        END IF;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER maintain_post_stats_on_reactions
AFTER INSERT OR DELETE ON reactions
FOR EACH ROW
WHEN (NEW.postId IS NOT NULL OR OLD.postId IS NOT NULL)
EXECUTE FUNCTION maintain_post_stats();

CREATE TRIGGER maintain_post_stats_on_comments
AFTER INSERT OR DELETE OR UPDATE OF deleted ON comments
FOR EACH ROW
EXECUTE FUNCTION maintain_post_stats();

CREATE TRIGGER maintain_post_stats_on_bookmarks
AFTER INSERT OR DELETE ON bookmarks
FOR EACH ROW
EXECUTE FUNCTION maintain_post_stats();

-- Verify triggers
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

COMMIT;
```

---

## Phase 6: Full-text Search Implementation (Week 3)

### Objective: Implement PostgreSQL full-text search

### Implementation Checklist:

- [ ] Create migration file: `006_fulltext_search.sql`
- [ ] Add tsvector columns
- [ ] Create GIN indexes
- [ ] Implement search function
- [ ] Create search ranking
- [ ] Test search performance
- [ ] Implement search suggestions

### SQL Implementation:

```sql
-- migrations/006_fulltext_search.sql
-- Full-text search implementation
-- Updated with user and group search

BEGIN;

-- =====================================================
-- POST SEARCH
-- =====================================================

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
        setweight(to_tsvector('english', COALESCE(NEW.metaKeywords::text, '')), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for post search vector
DROP TRIGGER IF EXISTS update_post_search_vector_trigger ON posts;
CREATE TRIGGER update_post_search_vector_trigger
BEFORE INSERT OR UPDATE OF title, excerpt, content, metaKeywords ON posts
FOR EACH ROW
EXECUTE FUNCTION update_post_search_vector();

-- Create GIN index for post search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_search_vector 
ON posts USING GIN (search_vector);

-- Update existing posts
UPDATE posts 
SET search_vector = 
    setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(excerpt, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(content::text, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(metaKeywords::text, '')), 'D')
WHERE search_vector IS NULL;

-- =====================================================
-- USER SEARCH
-- =====================================================

-- Add search vector to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create function to update user search vector
CREATE OR REPLACE FUNCTION update_user_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.username, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.bio, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user search
DROP TRIGGER IF EXISTS update_user_search_vector_trigger ON users;
CREATE TRIGGER update_user_search_vector_trigger
BEFORE INSERT OR UPDATE OF username, bio ON users
FOR EACH ROW
EXECUTE FUNCTION update_user_search_vector();

-- Create index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_search_vector 
ON users USING GIN (search_vector);

-- Update existing users
UPDATE users 
SET search_vector = 
    setweight(to_tsvector('english', COALESCE(username, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(bio, '')), 'C')
WHERE search_vector IS NULL;

-- =====================================================
-- GROUP SEARCH
-- =====================================================

-- Add search vector to groups
ALTER TABLE groups ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create function to update group search vector
CREATE OR REPLACE FUNCTION update_group_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.shortDescription, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C') ||
        setweight(to_tsvector('english', array_to_string(NEW.tags, ' ')), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_group_search_vector_trigger ON groups;
CREATE TRIGGER update_group_search_vector_trigger
BEFORE INSERT OR UPDATE OF name, shortDescription, description, tags ON groups
FOR EACH ROW
EXECUTE FUNCTION update_group_search_vector();

-- Create index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_search_vector 
ON groups USING GIN (search_vector);

-- Update existing groups
UPDATE groups 
SET search_vector = 
    setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(shortDescription, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(description, '')), 'C') ||
    setweight(to_tsvector('english', array_to_string(tags, ' ')), 'D')
WHERE search_vector IS NULL;

-- =====================================================
-- EVENT SEARCH
-- =====================================================

-- Add search vector to events
ALTER TABLE events ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create function to update event search vector
CREATE OR REPLACE FUNCTION update_event_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.shortDescription, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C') ||
        setweight(to_tsvector('english', array_to_string(NEW.tags, ' ')), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_event_search_vector_trigger ON events;
CREATE TRIGGER update_event_search_vector_trigger
BEFORE INSERT OR UPDATE OF title, shortDescription, description, tags ON events
FOR EACH ROW
EXECUTE FUNCTION update_event_search_vector();

-- Create index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_search_vector 
ON events USING GIN (search_vector);

-- =====================================================
-- SEARCH FUNCTIONS
-- =====================================================

-- Universal search function
CREATE OR REPLACE FUNCTION search_all(
    search_query TEXT,
    search_type TEXT DEFAULT 'all', -- 'all', 'posts', 'users', 'groups', 'events'
    limit_count INT DEFAULT 20,
    offset_count INT DEFAULT 0
)
RETURNS TABLE (
    result_type TEXT,
    id UUID,
    title TEXT,
    description TEXT,
    url TEXT,
    image_url TEXT,
    metadata JSONB,
    rank FLOAT
) AS $$
BEGIN
    RETURN QUERY
    WITH search_results AS (
        -- Posts
        SELECT 
            'post'::TEXT as result_type,
            p.id,
            p.title::TEXT,
            p.excerpt::TEXT as description,
            '/posts/' || p.slug as url,
            p.coverImage as image_url,
            jsonb_build_object(
                'authorName', COALESCE(u.username, p.authorName),
                'publishedAt', p.publishedAt,
                'categoryId', p.categoryId
            ) as metadata,
            ts_rank(p.search_vector, plainto_tsquery('english', search_query)) as rank
        FROM posts p
        LEFT JOIN users u ON p.authorId = u.id
        WHERE p.search_vector @@ plainto_tsquery('english', search_query)
            AND p.published = true
            AND p.deleted = false
            AND (search_type = 'all' OR search_type = 'posts')
        
        UNION ALL
        
        -- Users
        SELECT 
            'user'::TEXT,
            u.id,
            u.username::TEXT,
            u.bio::TEXT,
            '/users/' || u.username,
            u.image,
            jsonb_build_object(
                'role', u.role,
                'verified', u.verified,
                'level', u.level
            ),
            ts_rank(u.search_vector, plainto_tsquery('english', search_query)) * 0.8
        FROM users u
        WHERE u.search_vector @@ plainto_tsquery('english', search_query)
            AND u.deleted = false
            AND u.status = 'ACTIVE'
            AND (search_type = 'all' OR search_type = 'users')
        
        UNION ALL
        
        -- Groups
        SELECT 
            'group'::TEXT,
            g.id,
            g.name::TEXT,
            g.description::TEXT,
            '/groups/' || g.slug,
            g.coverImage,
            jsonb_build_object(
                'memberCount', g.memberCount,
                'visibility', g.visibility,
                'verified', g.isVerified
            ),
            ts_rank(g.search_vector, plainto_tsquery('english', search_query)) * 0.9
        FROM groups g
        WHERE g.search_vector @@ plainto_tsquery('english', search_query)
            AND g.deleted = false
            AND g.visibility != 'HIDDEN'
            AND (search_type = 'all' OR search_type = 'groups')
        
        UNION ALL
        
        -- Events
        SELECT 
            'event'::TEXT,
            e.id,
            e.title::TEXT,
            e.description::TEXT,
            '/events/' || e.slug,
            e.bannerImage,
            jsonb_build_object(
                'startTime', e.startTime,
                'endTime', e.endTime,
                'eventType', e.type,
                'isVirtual', e.isVirtual
            ),
            ts_rank(e.search_vector, plainto_tsquery('english', search_query)) * 0.85
        FROM events e
        WHERE e.search_vector @@ plainto_tsquery('english', search_query)
            AND e.deleted = false
            AND e.status != 'CANCELLED'
            AND (search_type = 'all' OR search_type = 'events')
    )
    SELECT * FROM search_results
    ORDER BY rank DESC, result_type
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Search suggestions using pg_trgm
CREATE OR REPLACE FUNCTION search_suggestions(
    partial_query TEXT,
    search_type TEXT DEFAULT 'all',
    limit_count INT DEFAULT 10
)
RETURNS TABLE (
    suggestion TEXT,
    result_type TEXT,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    WITH suggestions AS (
        -- Post titles
        SELECT DISTINCT
            title as suggestion,
            'post'::TEXT as result_type,
            similarity(title, partial_query) as similarity
        FROM posts
        WHERE title % partial_query
            AND published = true
            AND deleted = false
            AND (search_type = 'all' OR search_type = 'posts')
        
        UNION ALL
        
        -- Usernames
        SELECT DISTINCT
            username,
            'user'::TEXT,
            similarity(username, partial_query)
        FROM users
        WHERE username % partial_query
            AND deleted = false
            AND status = 'ACTIVE'
            AND (search_type = 'all' OR search_type = 'users')
        
        UNION ALL
        
        -- Group names
        SELECT DISTINCT
            name,
            'group'::TEXT,
            similarity(name, partial_query)
        FROM groups
        WHERE name % partial_query
            AND deleted = false
            AND visibility != 'HIDDEN'
            AND (search_type = 'all' OR search_type = 'groups')
    )
    SELECT * FROM suggestions
    WHERE similarity > 0.1
    ORDER BY similarity DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Test searches
SELECT * FROM search_all('sparkle', 'all', 5);
SELECT * FROM search_suggestions('spa', 'all', 5);

COMMIT;
```

---

## Phase 7: Table Partitioning (Week 4)

### Objective: Implement partitioning for large tables

### Implementation Checklist:

- [ ] Create migration file: `007_table_partitioning.sql`
- [ ] Partition analytics_events by time
- [ ] Partition activity_streams by time
- [ ] Partition audit_logs by action type
- [ ] Create partition maintenance function
- [ ] Schedule automatic partition creation
- [ ] Test partition pruning

### SQL Implementation:

```sql
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
```

---

## Phase 8: Advanced Indexes (Week 4)

### Objective: Create specialized indexes for complex queries

### Implementation Checklist:

- [ ] Create migration file: `008_advanced_indexes.sql`
- [ ] Implement partial indexes
- [ ] Create covering indexes
- [ ] Add expression indexes
- [ ] Test index usage with EXPLAIN
- [ ] Monitor index bloat
- [ ] Document index strategy

### SQL Implementation:

```sql
-- migrations/008_advanced_indexes.sql
-- Advanced indexing strategies

-- 1. Partial indexes for filtered queries
-- Index only active users
CREATE INDEX idx_users_active_partial 
ON users (lastSeenAt DESC) 
WHERE deleted = false AND status = 'ACTIVE';

-- Index only published posts
CREATE INDEX idx_posts_published_partial 
ON posts (publishedAt DESC) 
WHERE published = true AND deleted = false;

-- Index only unread notifications
CREATE INDEX idx_notifications_unread_partial 
ON notifications (userId, createdAt DESC) 
WHERE read = false;

-- 2. Covering indexes for common queries
-- User profile query covering index
CREATE INDEX idx_users_profile_covering 
ON users (id) 
INCLUDE (username, image, bio, verified, level);

-- Post listing covering index
CREATE INDEX idx_posts_listing_covering 
ON posts (publishedAt DESC) 
INCLUDE (title, slug, excerpt, coverImage)
WHERE published = true AND deleted = false;

-- 3. Expression indexes
-- Case-insensitive username search
CREATE INDEX idx_users_username_lower 
ON users (LOWER(username));

-- Date-based indexes for time queries
CREATE INDEX idx_posts_published_date 
ON posts (DATE(publishedAt)) 
WHERE published = true;

-- 4. Array indexes using GIN
CREATE INDEX idx_post_tags_gin 
ON posts USING GIN (metaKeywords);

CREATE INDEX idx_user_interests_gin 
ON profiles USING GIN (interests);

-- 5. Composite indexes for complex filters
CREATE INDEX idx_posts_complex_filter 
ON posts (categoryId, contentType, moderationStatus, publishedAt DESC)
WHERE published = true AND deleted = false;

-- 6. Indexes for JOIN operations
CREATE INDEX idx_reactions_join 
ON reactions (postId, type, userId);

CREATE INDEX idx_comments_thread 
ON comments (postId, parentId, createdAt)
WHERE deleted = false;

-- Analyze index usage
CREATE OR REPLACE VIEW index_usage_stats AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
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
    ORDER BY pg_relation_size(s.indexrelid) DESC;
END;
$$ LANGUAGE plpgsql;
```

---

## Phase 9: Monitoring and Optimization Setup (Week 5)

### Objective: Implement monitoring and performance tracking

### Implementation Checklist:

- [ ] Create migration file: `009_monitoring_setup.sql`
- [ ] Create performance monitoring views
- [ ] Implement slow query logging
- [ ] Set up cache hit ratio monitoring
- [ ] Create index bloat detection
- [ ] Implement query statistics
- [ ] Schedule regular VACUUM/ANALYZE

### SQL Implementation:

```sql
-- migrations/009_monitoring_setup.sql
-- Performance monitoring and optimization tools

-- 1. Query performance monitoring
CREATE OR REPLACE VIEW slow_queries AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    stddev_time,
    rows
FROM pg_stat_statements
WHERE mean_time > 100  -- Queries taking more than 100ms
ORDER BY mean_time DESC
LIMIT 50;

-- 2. Cache hit ratio monitoring
CREATE OR REPLACE VIEW cache_hit_ratios AS
SELECT 
    'index' as cache_type,
    sum(idx_blks_hit) / NULLIF(sum(idx_blks_hit + idx_blks_read), 0) as ratio
FROM pg_statio_user_indexes
UNION ALL
SELECT 
    'table' as cache_type,
    sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit + heap_blks_read), 0) as ratio
FROM pg_statio_user_tables;

-- 3. Table bloat detection
CREATE OR REPLACE VIEW table_bloat AS
WITH constants AS (
    SELECT current_setting('block_size')::NUMERIC AS bs
),
bloat_info AS (
    SELECT
        schemaname,
        tablename,
        cc.relpages,
        bs,
        CEIL((cc.reltuples * 
              ((datahdr + ma - (CASE WHEN datahdr%ma=0 THEN ma ELSE datahdr%ma END)) + 
               nullhdr + 4)) / (bs-20::FLOAT)) AS otta
    FROM (
        SELECT
            schemaname,
            tablename,
            (datawidth + (hdr + ma - (CASE WHEN hdr%ma=0 THEN ma ELSE hdr%ma END)))::NUMERIC AS datahdr,
            (maxfracsum * (nullhdr + ma - (CASE WHEN nullhdr%ma=0 THEN ma ELSE nullhdr%ma END))) AS nullhdr,
            hdr,
            ma,
            bs
        FROM (
            SELECT
                schemaname,
                tablename,
                hdr,
                ma,
                bs,
                SUM((1-null_frac)*avg_width) AS datawidth,
                MAX(null_frac) AS maxfracsum,
                hdr + (
                    SELECT 1 + COUNT(*)/8
                    FROM pg_stats s2
                    WHERE null_frac<>0 AND s2.schemaname = s.schemaname AND s2.tablename = s.tablename
                ) AS nullhdr
            FROM pg_stats s, constants
            GROUP BY 1,2,3,4,5
        ) AS foo
    ) AS rs
    JOIN pg_class cc ON cc.relname = rs.tablename
    JOIN pg_namespace nn ON cc.relnamespace = nn.oid AND nn.nspname = rs.schemaname
)
SELECT
    schemaname,
    tablename,
    pg_size_pretty(bs*relpages::BIGINT) AS real_size,
    pg_size_pretty(bs*otta::BIGINT) AS expected_size,
    ROUND(CASE WHEN otta=0 THEN 0.0 ELSE (relpages-otta)::NUMERIC/relpages END,2) AS bloat_ratio
FROM bloat_info
WHERE relpages > 100
    AND (relpages-otta)::NUMERIC/relpages > 0.2
ORDER BY (relpages-otta) DESC;

-- 4. Active connections monitoring
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
    LEFT(query, 100) as query_preview
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY query_start;

-- 5. Lock monitoring
CREATE OR REPLACE VIEW blocking_locks AS
SELECT 
    blocked_locks.pid AS blocked_pid,
    blocked_activity.usename AS blocked_user,
    blocking_locks.pid AS blocking_pid,
    blocking_activity.usename AS blocking_user,
    blocked_activity.query AS blocked_statement,
    blocking_activity.query AS blocking_statement
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

-- 6. Automatic maintenance function
CREATE OR REPLACE FUNCTION perform_maintenance()
RETURNS void AS $$
BEGIN
    -- Refresh materialized views
    REFRESH MATERIALIZED VIEW CONCURRENTLY trending_posts;
    REFRESH MATERIALIZED VIEW CONCURRENTLY top_creators;
    REFRESH MATERIALIZED VIEW CONCURRENTLY active_groups;
    
    -- Update table statistics
    ANALYZE users;
    ANALYZE posts;
    ANALYZE comments;
    
    -- Clean up old partitions
    PERFORM maintain_partitions();
END;
$$ LANGUAGE plpgsql;

-- Schedule maintenance (if pg_cron is available)
-- SELECT cron.schedule('nightly-maintenance', '0 2 * * *', 'SELECT perform_maintenance()');
```

---

## Implementation Timeline & Resource Requirements

### Week-by-Week Schedule

| Week | Phase | Tasks | Resources | Risk |
|------|-------|-------|-----------|------|
| 1 | Extensions & JSON | Enable extensions, create JSON indexes | 1 DBA | Low |
| 2 | Functions & Views | Create functions, materialized views | 1 DBA, 1 Dev | Medium |
| 3 | Triggers & Search | Implement triggers, full-text search | 2 Devs | High |
| 4 | Partitioning & Indexes | Partition tables, advanced indexes | 1 DBA, 1 Dev | High |
| 5 | Monitoring | Setup monitoring, optimization | 1 DBA | Low |

### Testing Strategy

1. **Unit Tests**: Test each function individually
2. **Integration Tests**: Test trigger cascades
3. **Performance Tests**: Benchmark before/after
4. **Load Tests**: Simulate production load
5. **Rollback Tests**: Verify rollback procedures

### Rollback Plan

Each phase includes rollback scripts:
```sql
-- Example rollback for Phase 1
DROP EXTENSION IF EXISTS pg_trgm CASCADE;
DROP EXTENSION IF EXISTS pgcrypto CASCADE;
```

### Monitoring Checklist

- [ ] Set up pg_stat_statements
- [ ] Configure slow query logging
- [ ] Implement performance dashboards
- [ ] Set up alerts for:
  - [ ] Cache hit ratio < 90%
  - [ ] Table bloat > 40%
  - [ ] Long-running queries > 5 minutes
  - [ ] Blocked queries > 1 minute
  - [ ] Failed materialized view refreshes

## Success Metrics

1. **Query Performance**: 50% reduction in average query time
2. **Cache Hit Ratio**: Maintain > 95%
3. **Index Usage**: All major queries use indexes
4. **Maintenance Window**: < 30 minutes daily
5. **Search Performance**: < 100ms for full-text search

## Conclusion

This comprehensive implementation plan addresses all 35+ database optimizations mentioned in the schema comments. By following this phased approach with integrated checklists, you can systematically implement these advanced PostgreSQL features while maintaining system stability and performance.

The plan prioritizes low-risk, high-impact changes first, building up to more complex implementations. Each phase includes testing and rollback procedures to ensure safe deployment.
