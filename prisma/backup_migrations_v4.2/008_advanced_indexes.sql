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
