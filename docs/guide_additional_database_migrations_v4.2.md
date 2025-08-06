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
-- Enable required PostgreSQL extensions for Sparkle Universe
-- Run with: psql -U postgres -d sparkle_db -f 001_enable_extensions.sql

-- Enable pg_trgm for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Enable pgcrypto for encryption functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enable uuid-ossp for UUID generation (if not using gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verify extensions
SELECT 
    extname AS extension_name,
    extversion AS version,
    extnamespace::regnamespace AS schema
FROM pg_extension
WHERE extname IN ('pg_trgm', 'pgcrypto', 'uuid-ossp')
ORDER BY extname;
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

-- Profile JSON indexes
CREATE INDEX CONCURRENTLY idx_profile_theme_preference 
ON profiles USING GIN (themePreference);

CREATE INDEX CONCURRENTLY idx_profile_notification_settings 
ON profiles USING GIN (notificationSettings);

CREATE INDEX CONCURRENTLY idx_profile_privacy_settings 
ON profiles USING GIN (privacySettings);

-- Post content index
CREATE INDEX CONCURRENTLY idx_post_content 
ON posts USING GIN (content);

-- Group guidelines index
CREATE INDEX CONCURRENTLY idx_group_guidelines 
ON groups USING GIN (guidelines);

-- Event agenda index
CREATE INDEX CONCURRENTLY idx_event_agenda 
ON events USING GIN (agenda);

-- Event recurrence index
CREATE INDEX CONCURRENTLY idx_event_recurrence 
ON events USING GIN (recurrence);

-- Specific JSON path indexes for frequent queries
CREATE INDEX CONCURRENTLY idx_post_content_type 
ON posts ((content->>'type'))
WHERE content IS NOT NULL;

CREATE INDEX CONCURRENTLY idx_profile_notification_language 
ON profiles ((notificationSettings->>'language'))
WHERE notificationSettings IS NOT NULL;

-- Verify indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size
FROM pg_indexes
WHERE indexname LIKE 'idx_%'
    AND (indexname LIKE '%json%' OR indexname LIKE '%gin%')
ORDER BY tablename, indexname;
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

-- Trigger 1: Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updatedAt (selective list shown)
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger 2: Update denormalized counts
CREATE OR REPLACE FUNCTION update_user_post_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE user_stats 
        SET totalPosts = totalPosts + 1
        WHERE userId = NEW.authorId;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE user_stats 
        SET totalPosts = totalPosts - 1
        WHERE userId = OLD.authorId;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER maintain_user_post_count
AFTER INSERT OR DELETE ON posts
FOR EACH ROW 
WHEN (NEW.published = true OR OLD.published = true)
EXECUTE FUNCTION update_user_post_count();

-- Trigger 3: Level progression checks
CREATE OR REPLACE FUNCTION check_user_level_progression()
RETURNS TRIGGER AS $$
DECLARE
    new_level INT;
    current_level INT;
BEGIN
    -- Calculate new level
    new_level := calculate_user_level(NEW.experience);
    current_level := OLD.level;
    
    -- Update level if changed
    IF new_level > current_level THEN
        NEW.level := new_level;
        
        -- Create notification for level up
        INSERT INTO notifications (
            type, userId, title, message, 
            priority, createdAt
        ) VALUES (
            'LEVEL_UP', 
            NEW.id,
            'Level Up!',
            'Congratulations! You reached level ' || new_level || '!',
            1,
            NOW()
        );
        
        -- Log XP event
        INSERT INTO xp_logs (
            userId, amount, source, reason, 
            totalXp, createdAt
        ) VALUES (
            NEW.id,
            0,
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

-- Trigger 4: Achievement progress tracking
CREATE OR REPLACE FUNCTION track_achievement_progress()
RETURNS TRIGGER AS $$
DECLARE
    achievement RECORD;
    current_progress FLOAT;
BEGIN
    -- Example: Check "First Post" achievement
    IF TG_TABLE_NAME = 'posts' AND TG_OP = 'INSERT' THEN
        -- Check if user already has the achievement
        SELECT * INTO achievement
        FROM achievements a
        WHERE a.code = 'FIRST_POST'
            AND NOT EXISTS (
                SELECT 1 FROM user_achievements ua
                WHERE ua.userId = NEW.authorId
                    AND ua.achievementId = a.id
            );
        
        IF FOUND THEN
            -- Grant achievement
            INSERT INTO user_achievements (
                userId, achievementId, progress,
                unlockedAt, notified
            ) VALUES (
                NEW.authorId,
                achievement.id,
                1.0,
                NOW(),
                false
            );
            
            -- Create notification
            INSERT INTO notifications (
                type, userId, entityId, entityType,
                title, message, priority
            ) VALUES (
                'ACHIEVEMENT_UNLOCKED',
                NEW.authorId,
                achievement.id,
                'achievement',
                'Achievement Unlocked!',
                'You unlocked: ' || achievement.name,
                1
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_post_achievements
AFTER INSERT ON posts
FOR EACH ROW
WHEN (NEW.published = true)
EXECUTE FUNCTION track_achievement_progress();

-- Verify triggers
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
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

-- Add tsvector columns to posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create function to update search vector
CREATE OR REPLACE FUNCTION update_post_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.excerpt, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.content::text, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for search vector
CREATE TRIGGER update_post_search_vector_trigger
BEFORE INSERT OR UPDATE OF title, excerpt, content ON posts
FOR EACH ROW
EXECUTE FUNCTION update_post_search_vector();

-- Create GIN index for full-text search
CREATE INDEX idx_post_search_vector ON posts USING GIN (search_vector);

-- Update existing posts
UPDATE posts SET search_vector = 
    setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(excerpt, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(content::text, '')), 'C');

-- Create search function
CREATE OR REPLACE FUNCTION search_posts(
    search_query TEXT,
    limit_count INT DEFAULT 20,
    offset_count INT DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    title VARCHAR(500),
    excerpt TEXT,
    slug VARCHAR(255),
    authorId UUID,
    authorName VARCHAR(255),
    publishedAt TIMESTAMP,
    rank FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.excerpt,
        p.slug,
        p.authorId,
        COALESCE(u.username, p.authorName) as authorName,
        p.publishedAt,
        ts_rank(p.search_vector, plainto_tsquery('english', search_query)) as rank
    FROM posts p
    LEFT JOIN users u ON p.authorId = u.id
    WHERE p.search_vector @@ plainto_tsquery('english', search_query)
        AND p.published = true
        AND p.deleted = false
    ORDER BY rank DESC, p.publishedAt DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Create search suggestions using pg_trgm
CREATE OR REPLACE FUNCTION search_suggestions(
    partial_query TEXT,
    limit_count INT DEFAULT 10
)
RETURNS TABLE (
    suggestion TEXT,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        title as suggestion,
        similarity(title, partial_query) as similarity
    FROM posts
    WHERE title % partial_query  -- Uses pg_trgm
        AND published = true
        AND deleted = false
    ORDER BY similarity DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Test search
SELECT * FROM search_posts('sparkle universe');
SELECT * FROM search_suggestions('spar');
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
