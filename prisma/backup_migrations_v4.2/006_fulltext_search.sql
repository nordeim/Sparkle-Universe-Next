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
