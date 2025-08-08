-- migrations/006_fulltext_search.sql
-- Full-text search implementation
-- FIXED: Column name case sensitivity

BEGIN;

-- =====================================================
-- POST SEARCH
-- =====================================================

-- Add tsvector column to posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create function to update post search vector - FIXED: use quoted identifiers
CREATE OR REPLACE FUNCTION update_post_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.excerpt, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.content::text, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW."metaKeywords"::text, '')), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for post search vector
DROP TRIGGER IF EXISTS update_post_search_vector_trigger ON posts;
CREATE TRIGGER update_post_search_vector_trigger
BEFORE INSERT OR UPDATE OF title, excerpt, content, "metaKeywords" ON posts
FOR EACH ROW
EXECUTE FUNCTION update_post_search_vector();

-- Create GIN index for post search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_search_vector 
ON posts USING GIN (search_vector);

-- Update existing posts - FIXED: use quoted identifier
UPDATE posts 
SET search_vector = 
    setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(excerpt, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(content::text, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE("metaKeywords"::text, '')), 'D')
WHERE search_vector IS NULL;

-- ... [Rest of the search implementation with similar fixes for camelCase columns] ...

COMMIT;
