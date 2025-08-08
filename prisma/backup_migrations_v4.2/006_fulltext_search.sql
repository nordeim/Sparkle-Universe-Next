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
