-- migrations/002_json_gin_indexes.sql
-- JSON GIN indexes for improved query performance
-- Updated for v4.3 schema with complete JSON field coverage
-- Last updated: Added Message and Poll JSON indexes

BEGIN;

-- =====================================================
-- PROFILE JSON INDEXES
-- =====================================================

-- Profile JSON indexes (v4.1 extracted some fields)
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

-- =====================================================
-- POST CONTENT AND METADATA
-- =====================================================

-- Post content and metadata
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_content 
ON posts USING GIN (content);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_sponsor_info 
ON posts USING GIN (sponsorInfo)
WHERE sponsorInfo IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_youtube_video_data 
ON posts USING GIN (youtubeVideoData)
WHERE youtubeVideoData IS NOT NULL;

-- =====================================================
-- GROUP SETTINGS AND CONFIGURATION
-- =====================================================

-- Group settings and guidelines
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_guidelines 
ON groups USING GIN (guidelines)
WHERE guidelines IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_settings 
ON groups USING GIN (settings);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_custom_emojis 
ON groups USING GIN (customEmojis)
WHERE customEmojis IS NOT NULL;

-- Group metadata
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_metadata 
ON groups USING GIN (metadata)
WHERE metadata IS NOT NULL;

-- =====================================================
-- EVENT COMPLEX FIELDS
-- =====================================================

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

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_materials 
ON events USING GIN (materials)
WHERE materials IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_feedback 
ON events USING GIN (feedback)
WHERE feedback IS NOT NULL;

-- =====================================================
-- TRADING AND MARKETPLACE
-- =====================================================

-- Trade items
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trade_initiator_items 
ON trades USING GIN (initiatorItems);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trade_recipient_items 
ON trades USING GIN (recipientItems);

-- =====================================================
-- GAMIFICATION SYSTEM
-- =====================================================

-- Quest requirements and rewards
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quest_requirements 
ON quests USING GIN (requirements);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quest_rewards 
ON quests USING GIN (rewards);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quest_metadata 
ON quests USING GIN (metadata)
WHERE metadata IS NOT NULL;

-- User quest progress
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_quest_progress 
ON user_quests USING GIN (progress);

-- Achievement criteria
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_achievement_criteria 
ON achievements USING GIN (criteria)
WHERE criteria IS NOT NULL;

-- =====================================================
-- AI AND PERSONALIZATION
-- =====================================================

-- User AI preferences
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_ai_content_preferences 
ON user_ai_preferences USING GIN (contentPreferences);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_ai_writing_style 
ON user_ai_preferences USING GIN (writingStyle)
WHERE writingStyle IS NOT NULL;

-- AI recommendations context
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_recommendation_context 
ON ai_recommendations USING GIN (context)
WHERE context IS NOT NULL;

-- =====================================================
-- MESSAGING SYSTEM (NEW IN UPDATE)
-- =====================================================

-- Message attachments for file/media queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_attachments 
ON messages USING GIN (attachments)
WHERE attachments IS NOT NULL;

-- Message reactions for reaction analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_reactions 
ON messages USING GIN (reactions)
WHERE reactions IS NOT NULL;

-- Message metadata
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_metadata 
ON messages USING GIN (metadata)
WHERE metadata IS NOT NULL;

-- Message edit history
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_edit_history 
ON messages USING GIN (editHistory)
WHERE editHistory IS NOT NULL AND array_length(editHistory, 1) > 0;

-- Conversation settings
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversation_settings 
ON conversations USING GIN (settings);

-- =====================================================
-- POLLING SYSTEM (NEW IN UPDATE)
-- =====================================================

-- Poll final results for analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_poll_final_results 
ON polls USING GIN (finalResults)
WHERE finalResults IS NOT NULL;

-- Poll vote metadata
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_poll_vote_metadata 
ON poll_votes USING GIN (metadata)
WHERE metadata IS NOT NULL;

-- Poll option metadata
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_poll_option_metadata 
ON poll_options USING GIN (metadata)
WHERE metadata IS NOT NULL;

-- =====================================================
-- SPECIFIC JSON PATH INDEXES
-- =====================================================

-- Specific JSON path indexes for frequent queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_content_type 
ON posts ((content->>'type'))
WHERE content IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_content_blocks 
ON posts ((content->'blocks'))
WHERE content IS NOT NULL AND content ? 'blocks';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profile_notification_language 
ON profiles ((notificationSettings->>'language'))
WHERE notificationSettings IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profile_notification_email_frequency 
ON profiles ((notificationSettings->>'emailDigestFrequency'))
WHERE notificationSettings IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_settings_max_members 
ON groups ((settings->>'maxMembers'))
WHERE settings IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_settings_join_approval 
ON groups ((settings->>'joinApproval'))
WHERE settings IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_location_lat 
ON events ((locationCoords->>'lat'))
WHERE locationCoords IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_location_lng 
ON events ((locationCoords->>'lng'))
WHERE locationCoords IS NOT NULL;

-- =====================================================
-- VERIFICATION AND ANALYSIS
-- =====================================================

-- Comprehensive index verification
SELECT 
    n.nspname as schema_name,
    t.relname as table_name,
    i.relname as index_name,
    am.amname as index_type,
    pg_size_pretty(pg_relation_size(i.oid)) as index_size,
    idx.indisprimary as is_primary,
    idx.indisunique as is_unique,
    CASE 
        WHEN am.amname = 'gin' THEN 'JSON/Array Index'
        WHEN i.relname LIKE '%content%' THEN 'Content Index'
        WHEN i.relname LIKE '%metadata%' THEN 'Metadata Index'
        WHEN i.relname LIKE '%settings%' THEN 'Settings Index'
        ELSE 'Other'
    END as index_category
FROM pg_index idx
JOIN pg_class i ON i.oid = idx.indexrelid
JOIN pg_class t ON t.oid = idx.indrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
JOIN pg_am am ON am.oid = i.relam
WHERE n.nspname = 'public'
    AND (am.amname = 'gin' OR i.relname LIKE 'idx_%json%' OR i.relname LIKE 'idx_%gin%')
ORDER BY 
    CASE 
        WHEN t.relname = 'posts' THEN 1
        WHEN t.relname = 'profiles' THEN 2
        WHEN t.relname = 'messages' THEN 3
        ELSE 4
    END,
    t.relname, 
    i.relname;

-- Count JSON indexes by table
SELECT 
    t.relname as table_name,
    COUNT(*) as json_index_count,
    SUM(pg_relation_size(i.oid)) as total_index_size,
    pg_size_pretty(SUM(pg_relation_size(i.oid))) as total_size_pretty
FROM pg_index idx
JOIN pg_class i ON i.oid = idx.indexrelid
JOIN pg_class t ON t.oid = idx.indrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
JOIN pg_am am ON am.oid = i.relam
WHERE n.nspname = 'public'
    AND am.amname = 'gin'
GROUP BY t.relname
ORDER BY json_index_count DESC;

COMMIT;

-- Post-deployment verification
-- Run this query to ensure all JSON fields have appropriate indexes:
/*
SELECT 
    c.table_name,
    c.column_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM pg_indexes 
            WHERE tablename = c.table_name 
            AND indexdef LIKE '%' || c.column_name || '%'
            AND indexdef LIKE '%gin%'
        ) THEN 'Indexed'
        ELSE 'Not Indexed'
    END as index_status
FROM information_schema.columns c
WHERE c.table_schema = 'public'
    AND c.data_type = 'jsonb'
    AND c.table_name NOT LIKE '%_old'
ORDER BY 
    CASE WHEN index_status = 'Not Indexed' THEN 0 ELSE 1 END,
    c.table_name, 
    c.column_name;
*/
