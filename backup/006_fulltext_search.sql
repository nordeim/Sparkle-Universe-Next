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
