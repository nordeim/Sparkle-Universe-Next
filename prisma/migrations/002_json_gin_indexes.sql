-- migrations/002_json_gin_indexes.sql
-- JSON GIN indexes for improved query performance
-- IMPORTANT: This script uses CONCURRENTLY and must run OUTSIDE transactions
-- Run each CREATE INDEX separately or use the provided execution script

-- =====================================================
-- EXECUTION INSTRUCTIONS
-- =====================================================
-- Option 1: Run this entire file WITHOUT transaction
-- Option 2: Use psql with: \set ON_ERROR_STOP on
-- Option 3: Use the batch execution script below

-- =====================================================
-- PROFILE JSON INDEXES
-- =====================================================

-- Profile JSON indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profile_theme_preference 
ON profiles USING GIN ("themePreference")
WHERE "themePreference" IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profile_notification_settings 
ON profiles USING GIN ("notificationSettings");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profile_privacy_settings 
ON profiles USING GIN ("privacySettings");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profile_social_links 
ON profiles USING GIN ("socialLinks")
WHERE "socialLinks" IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profile_youtube_channel_data 
ON profiles USING GIN ("youtubeChannelData")
WHERE "youtubeChannelData" IS NOT NULL;

-- =====================================================
-- POST CONTENT AND METADATA
-- =====================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_content 
ON posts USING GIN (content);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_sponsor_info 
ON posts USING GIN ("sponsorInfo")
WHERE "sponsorInfo" IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_youtube_video_data 
ON posts USING GIN ("youtubeVideoData")
WHERE "youtubeVideoData" IS NOT NULL;

-- =====================================================
-- GROUP SETTINGS AND CONFIGURATION
-- =====================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_guidelines 
ON groups USING GIN (guidelines)
WHERE guidelines IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_settings 
ON groups USING GIN (settings);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_custom_emojis 
ON groups USING GIN ("customEmojis")
WHERE "customEmojis" IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_metadata 
ON groups USING GIN (metadata)
WHERE metadata IS NOT NULL;

-- =====================================================
-- EVENT COMPLEX FIELDS
-- =====================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_agenda 
ON events USING GIN (agenda)
WHERE agenda IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_location_coords 
ON events USING GIN ("locationCoords")
WHERE "locationCoords" IS NOT NULL;

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

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trade_initiator_items 
ON trades USING GIN ("initiatorItems");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trade_recipient_items 
ON trades USING GIN ("recipientItems");

-- =====================================================
-- GAMIFICATION SYSTEM
-- =====================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quest_requirements 
ON quests USING GIN (requirements);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quest_rewards 
ON quests USING GIN (rewards);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quest_metadata 
ON quests USING GIN (metadata)
WHERE metadata IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_quest_progress 
ON user_quests USING GIN (progress);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_achievement_criteria 
ON achievements USING GIN (criteria)
WHERE criteria IS NOT NULL;

-- =====================================================
-- AI AND PERSONALIZATION
-- =====================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_ai_content_preferences 
ON user_ai_preferences USING GIN ("contentPreferences");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_ai_writing_style 
ON user_ai_preferences USING GIN ("writingStyle")
WHERE "writingStyle" IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_recommendation_context 
ON ai_recommendations USING GIN (context)
WHERE context IS NOT NULL;

-- =====================================================
-- MESSAGING SYSTEM
-- =====================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_attachments 
ON messages USING GIN (attachments)
WHERE attachments IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_reactions 
ON messages USING GIN (reactions)
WHERE reactions IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_metadata 
ON messages USING GIN (metadata)
WHERE metadata IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_edit_history 
ON messages USING GIN ("editHistory")
WHERE "editHistory" IS NOT NULL AND array_length("editHistory", 1) > 0;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversation_settings 
ON conversations USING GIN (settings);

-- =====================================================
-- POLLING SYSTEM
-- =====================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_poll_final_results 
ON polls USING GIN ("finalResults")
WHERE "finalResults" IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_poll_vote_metadata 
ON poll_votes USING GIN (metadata)
WHERE metadata IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_poll_option_metadata 
ON poll_options USING GIN (metadata)
WHERE metadata IS NOT NULL;

-- =====================================================
-- SPECIFIC JSON PATH INDEXES
-- =====================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_content_type 
ON posts ((content->>'type'))
WHERE content IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_content_blocks 
ON posts ((content->'blocks'))
WHERE content IS NOT NULL AND content ? 'blocks';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profile_notification_language 
ON profiles (("notificationSettings"->>'language'))
WHERE "notificationSettings" IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profile_notification_email_frequency 
ON profiles (("notificationSettings"->>'emailDigestFrequency'))
WHERE "notificationSettings" IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_settings_max_members 
ON groups ((settings->>'maxMembers'))
WHERE settings IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_settings_join_approval 
ON groups ((settings->>'joinApproval'))
WHERE settings IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_location_lat 
ON events (("locationCoords"->>'lat'))
WHERE "locationCoords" IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_location_lng 
ON events (("locationCoords"->>'lng'))
WHERE "locationCoords" IS NOT NULL;

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- Run this in a separate transaction to verify indexes

/*
BEGIN;

SELECT 
    n.nspname as schema_name,
    t.relname as table_name,
    i.relname as index_name,
    am.amname as index_type,
    pg_size_pretty(pg_relation_size(i.oid)) as index_size,
    CASE 
        WHEN am.amname = 'gin' THEN 'JSON/Array Index'
        ELSE 'Other'
    END as index_category
FROM pg_index idx
JOIN pg_class i ON i.oid = idx.indexrelid
JOIN pg_class t ON t.oid = idx.indrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
JOIN pg_am am ON am.oid = i.relam
WHERE n.nspname = 'public'
    AND am.amname = 'gin'
ORDER BY t.relname, i.relname;

COMMIT;
*/
