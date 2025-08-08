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
