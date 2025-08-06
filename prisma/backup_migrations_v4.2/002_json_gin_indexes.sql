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
