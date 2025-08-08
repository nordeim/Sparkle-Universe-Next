-- migrations/005_database_triggers.sql
-- Database triggers for automatic data maintenance
-- CRITICAL: Added comprehensive soft delete and achievement triggers

BEGIN;

-- =====================================================
-- SOFT DELETE ENFORCEMENT (CRITICAL)
-- =====================================================

-- Universal soft delete enforcement function
CREATE OR REPLACE FUNCTION enforce_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- When marking as deleted, ensure deletedAt is set
    IF NEW.deleted = true AND OLD.deleted = false THEN
        NEW.deletedAt := NOW();
        
        -- Set deletedBy if we have user context (would need to be passed via session)
        -- This would typically be set at the application layer
        -- NEW.deletedBy := current_setting('app.current_user_id', true);
    END IF;
    
    -- When unmarking as deleted, clear deletion fields
    IF NEW.deleted = false AND OLD.deleted = true THEN
        NEW.deletedAt := NULL;
        NEW.deletedBy := NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply soft delete triggers to ALL tables with the pattern
CREATE TRIGGER enforce_soft_delete_users
BEFORE UPDATE OF deleted ON users
FOR EACH ROW EXECUTE FUNCTION enforce_soft_delete();

CREATE TRIGGER enforce_soft_delete_categories
BEFORE UPDATE OF deleted ON categories
FOR EACH ROW EXECUTE FUNCTION enforce_soft_delete();

CREATE TRIGGER enforce_soft_delete_posts
BEFORE UPDATE OF deleted ON posts
FOR EACH ROW EXECUTE FUNCTION enforce_soft_delete();

CREATE TRIGGER enforce_soft_delete_post_series
BEFORE UPDATE OF deleted ON post_series
FOR EACH ROW EXECUTE FUNCTION enforce_soft_delete();

CREATE TRIGGER enforce_soft_delete_tags
BEFORE UPDATE OF deleted ON tags
FOR EACH ROW EXECUTE FUNCTION enforce_soft_delete();

CREATE TRIGGER enforce_soft_delete_comments
BEFORE UPDATE OF deleted ON comments
FOR EACH ROW EXECUTE FUNCTION enforce_soft_delete();

CREATE TRIGGER enforce_soft_delete_polls
BEFORE UPDATE OF deleted ON polls
FOR EACH ROW EXECUTE FUNCTION enforce_soft_delete();

CREATE TRIGGER enforce_soft_delete_achievements
BEFORE UPDATE OF deleted ON achievements
FOR EACH ROW EXECUTE FUNCTION enforce_soft_delete();

CREATE TRIGGER enforce_soft_delete_user_achievements
BEFORE UPDATE OF deleted ON user_achievements
FOR EACH ROW EXECUTE FUNCTION enforce_soft_delete();

CREATE TRIGGER enforce_soft_delete_trades
BEFORE UPDATE OF deleted ON trades
FOR EACH ROW EXECUTE FUNCTION enforce_soft_delete();

CREATE TRIGGER enforce_soft_delete_youtube_channels
BEFORE UPDATE OF deleted ON youtube_channels
FOR EACH ROW EXECUTE FUNCTION enforce_soft_delete();

CREATE TRIGGER enforce_soft_delete_watch_parties
BEFORE UPDATE OF deleted ON watch_parties
FOR EACH ROW EXECUTE FUNCTION enforce_soft_delete();

CREATE TRIGGER enforce_soft_delete_groups
BEFORE UPDATE OF deleted ON groups
FOR EACH ROW EXECUTE FUNCTION enforce_soft_delete();

CREATE TRIGGER enforce_soft_delete_events
BEFORE UPDATE OF deleted ON events
FOR EACH ROW EXECUTE FUNCTION enforce_soft_delete();

CREATE TRIGGER enforce_soft_delete_conversations
BEFORE UPDATE OF deleted ON conversations
FOR EACH ROW EXECUTE FUNCTION enforce_soft_delete();

CREATE TRIGGER enforce_soft_delete_messages
BEFORE UPDATE OF deleted ON messages
FOR EACH ROW EXECUTE FUNCTION enforce_soft_delete();

CREATE TRIGGER enforce_soft_delete_chat_messages
BEFORE UPDATE OF deleted ON chat_messages
FOR EACH ROW EXECUTE FUNCTION enforce_soft_delete();

CREATE TRIGGER enforce_soft_delete_reports
BEFORE UPDATE OF deleted ON reports
FOR EACH ROW EXECUTE FUNCTION enforce_soft_delete();

CREATE TRIGGER enforce_soft_delete_watch_party_chat
BEFORE UPDATE OF deleted ON watch_party_chat
FOR EACH ROW EXECUTE FUNCTION enforce_soft_delete();

-- =====================================================
-- TIMESTAMP MANAGEMENT
-- =====================================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updatedAt
CREATE TRIGGER update_updated_at_users BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_updated_at_posts BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_updated_at_profiles BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Continue for all tables with updatedAt...

-- =====================================================
-- DENORMALIZED COUNT MAINTENANCE
-- =====================================================

-- Update user post count
CREATE OR REPLACE FUNCTION update_user_post_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.published = true THEN
        UPDATE user_stats 
        SET totalPosts = totalPosts + 1,
            lastActivityAt = NOW()
        WHERE userId = NEW.authorId;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle publish/unpublish
        IF OLD.published = false AND NEW.published = true THEN
            UPDATE user_stats 
            SET totalPosts = totalPosts + 1,
                lastActivityAt = NOW()
            WHERE userId = NEW.authorId;
        ELSIF OLD.published = true AND NEW.published = false THEN
            UPDATE user_stats 
            SET totalPosts = GREATEST(totalPosts - 1, 0)
            WHERE userId = NEW.authorId;
        END IF;
    ELSIF TG_OP = 'DELETE' AND OLD.published = true THEN
        UPDATE user_stats 
        SET totalPosts = GREATEST(totalPosts - 1, 0)
        WHERE userId = OLD.authorId;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER maintain_user_post_count
AFTER INSERT OR UPDATE OR DELETE ON posts
FOR EACH ROW 
EXECUTE FUNCTION update_user_post_count();

-- Update follower counts
CREATE OR REPLACE FUNCTION update_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update follower count for followed user
        UPDATE user_stats 
        SET totalFollowers = totalFollowers + 1
        WHERE userId = NEW.followingId;
        
        -- Update following count for follower
        UPDATE user_stats 
        SET totalFollowing = totalFollowing + 1
        WHERE userId = NEW.followerId;
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Update follower count for unfollowed user
        UPDATE user_stats 
        SET totalFollowers = GREATEST(totalFollowers - 1, 0)
        WHERE userId = OLD.followingId;
        
        -- Update following count for unfollower
        UPDATE user_stats 
        SET totalFollowing = GREATEST(totalFollowing - 1, 0)
        WHERE userId = OLD.followerId;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER maintain_follower_counts
AFTER INSERT OR DELETE ON follows
FOR EACH ROW 
EXECUTE FUNCTION update_follower_counts();

-- =====================================================
-- LEVEL PROGRESSION (FIXED)
-- =====================================================

CREATE OR REPLACE FUNCTION check_user_level_progression()
RETURNS TRIGGER AS $$
DECLARE
    new_level INT;
    current_level INT;
    level_data RECORD;
BEGIN
    -- Only process if experience changed
    IF NEW.experience = OLD.experience THEN
        RETURN NEW;
    END IF;
    
    -- Calculate new level using level_configs
    new_level := calculate_user_level(NEW.experience);
    current_level := OLD.level;
    
    -- Update level if changed
    IF new_level > current_level THEN
        NEW.level := new_level;
        
        -- Get level rewards
        SELECT * INTO level_data
        FROM level_configs
        WHERE level = new_level;
        
        -- Create level up notification
        INSERT INTO notifications (
            id, type, userId, title, message, 
            priority, createdAt
        ) VALUES (
            gen_random_uuid(),
            'LEVEL_UP', 
            NEW.id,
            'Level Up! You reached level ' || new_level || '!',
            'Congratulations! You are now a ' || COALESCE(level_data.title, 'Level ' || new_level) || '!',
            1,
            NOW()
        );
        
        -- Award level rewards
        IF level_data.sparkleReward > 0 THEN
            UPDATE user_balances
            SET sparklePoints = sparklePoints + level_data.sparkleReward,
                lifetimeEarned = lifetimeEarned + level_data.sparkleReward
            WHERE userId = NEW.id;
            
            -- Log currency transaction
            INSERT INTO currency_transactions (
                id, userId, amount, currencyType, transactionType,
                source, description, balanceBefore, balanceAfter, createdAt
            ) VALUES (
                gen_random_uuid(),
                NEW.id,
                level_data.sparkleReward,
                'sparkle',
                'earn',
                'level_up',
                'Level ' || new_level || ' reward',
                (SELECT sparklePoints - level_data.sparkleReward FROM user_balances WHERE userId = NEW.id),
                (SELECT sparklePoints FROM user_balances WHERE userId = NEW.id),
                NOW()
            );
        END IF;
        
        -- Log XP event
        INSERT INTO xp_logs (
            id, userId, amount, source, reason, 
            totalXp, createdAt
        ) VALUES (
            gen_random_uuid(),
            NEW.id,
            NEW.experience - OLD.experience,
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

-- =====================================================
-- COMPREHENSIVE ACHIEVEMENT SYSTEM
-- =====================================================

CREATE OR REPLACE FUNCTION track_achievement_progress()
RETURNS TRIGGER AS $$
DECLARE
    achievement RECORD;
    user_data RECORD;
    progress_update FLOAT;
BEGIN
    -- Different achievement checks based on trigger source
    IF TG_TABLE_NAME = 'posts' THEN
        -- First Post Achievement
        IF TG_OP = 'INSERT' AND NEW.published = true THEN
            -- Check first post achievement
            IF check_achievement_eligibility(NEW.authorId, 'FIRST_POST') THEN
                PERFORM grant_achievement(NEW.authorId, 'FIRST_POST');
            END IF;
            
            -- Check prolific writer (50 posts)
            SELECT totalPosts INTO user_data FROM user_stats WHERE userId = NEW.authorId;
            IF user_data.totalPosts >= 50 AND check_achievement_eligibility(NEW.authorId, 'PROLIFIC_WRITER') THEN
                PERFORM grant_achievement(NEW.authorId, 'PROLIFIC_WRITER');
            END IF;
        END IF;
        
    ELSIF TG_TABLE_NAME = 'follows' THEN
        -- Social achievements
        IF TG_OP = 'INSERT' THEN
            SELECT totalFollowers INTO user_data FROM user_stats WHERE userId = NEW.followingId;
            
            -- First follower
            IF user_data.totalFollowers = 1 AND check_achievement_eligibility(NEW.followingId, 'FIRST_FOLLOWER') THEN
                PERFORM grant_achievement(NEW.followingId, 'FIRST_FOLLOWER');
            END IF;
            
            -- Social butterfly (100 followers)
            IF user_data.totalFollowers >= 100 AND check_achievement_eligibility(NEW.followingId, 'SOCIAL_BUTTERFLY') THEN
                PERFORM grant_achievement(NEW.followingId, 'SOCIAL_BUTTERFLY');
            END IF;
            
            -- Influencer (1000 followers)
            IF user_data.totalFollowers >= 1000 AND check_achievement_eligibility(NEW.followingId, 'INFLUENCER') THEN
                PERFORM grant_achievement(NEW.followingId, 'INFLUENCER');
            END IF;
        END IF;
        
    ELSIF TG_TABLE_NAME = 'user_stats' THEN
        -- Streak achievements
        IF NEW.streakDays >= 7 AND OLD.streakDays < 7 THEN
            IF check_achievement_eligibility(NEW.userId, 'STREAK_WEEK') THEN
                PERFORM grant_achievement(NEW.userId, 'STREAK_WEEK');
            END IF;
        END IF;
        
        IF NEW.streakDays >= 30 AND OLD.streakDays < 30 THEN
            IF check_achievement_eligibility(NEW.userId, 'STREAK_MONTH') THEN
                PERFORM grant_achievement(NEW.userId, 'STREAK_MONTH');
            END IF;
        END IF;
        
    ELSIF TG_TABLE_NAME = 'reactions' THEN
        -- Engagement achievements
        IF TG_OP = 'INSERT' AND NEW.postId IS NOT NULL THEN
            -- Get post author
            SELECT authorId INTO user_data FROM posts WHERE id = NEW.postId;
            
            -- Update total likes received
            UPDATE user_stats 
            SET totalLikesReceived = totalLikesReceived + 1
            WHERE userId = user_data.authorId;
            
            -- Check likes milestones
            SELECT totalLikesReceived INTO user_data FROM user_stats WHERE userId = user_data.authorId;
            
            IF user_data.totalLikesReceived >= 100 AND check_achievement_eligibility(user_data.authorId, 'WELL_LIKED') THEN
                PERFORM grant_achievement(user_data.authorId, 'WELL_LIKED');
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Helper function to grant achievements
CREATE OR REPLACE FUNCTION grant_achievement(
    p_user_id UUID,
    p_achievement_code TEXT
)
RETURNS VOID AS $$
DECLARE
    achievement RECORD;
BEGIN
    -- Get achievement details
    SELECT * INTO achievement
    FROM achievements
    WHERE code = p_achievement_code AND deleted = false;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Grant achievement
    INSERT INTO user_achievements (
        id, userId, achievementId, progress,
        unlockedAt, notified, claimedRewards
    ) VALUES (
        gen_random_uuid(),
        p_user_id,
        achievement.id,
        1.0,
        NOW(),
        false,
        false
    )
    ON CONFLICT (userId, achievementId) DO NOTHING;
    
    -- Create notification
    INSERT INTO notifications (
        id, type, userId, entityId, entityType,
        title, message, priority, imageUrl, createdAt
    ) VALUES (
        gen_random_uuid(),
        'ACHIEVEMENT_UNLOCKED',
        p_user_id,
        achievement.id,
        'achievement',
        'Achievement Unlocked!',
        'You unlocked: ' || achievement.name || COALESCE(' - ' || achievement.shortDescription, ''),
        1,
        achievement.icon,
        NOW()
    );
    
    -- Award XP if specified
    IF achievement.xpReward > 0 THEN
        UPDATE users
        SET experience = experience + achievement.xpReward
        WHERE id = p_user_id;
    END IF;
    
    -- Award currency if specified
    IF achievement.sparklePointsReward > 0 THEN
        UPDATE user_balances
        SET sparklePoints = sparklePoints + achievement.sparklePointsReward,
            lifetimeEarned = lifetimeEarned + achievement.sparklePointsReward
        WHERE userId = p_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Apply achievement triggers
CREATE TRIGGER track_post_achievements
AFTER INSERT ON posts
FOR EACH ROW
WHEN (NEW.published = true)
EXECUTE FUNCTION track_achievement_progress();

CREATE TRIGGER track_follow_achievements
AFTER INSERT ON follows
FOR EACH ROW
EXECUTE FUNCTION track_achievement_progress();

CREATE TRIGGER track_streak_achievements
AFTER UPDATE OF streakDays ON user_stats
FOR EACH ROW
EXECUTE FUNCTION track_achievement_progress();

CREATE TRIGGER track_reaction_achievements
AFTER INSERT ON reactions
FOR EACH ROW
EXECUTE FUNCTION track_achievement_progress();

-- =====================================================
-- POST STATS MAINTENANCE
-- =====================================================

CREATE OR REPLACE FUNCTION maintain_post_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update post stats when reactions change
    IF TG_TABLE_NAME = 'reactions' THEN
        IF TG_OP IN ('INSERT', 'DELETE') THEN
            PERFORM update_post_stats(COALESCE(NEW.postId, OLD.postId));
        END IF;
        
    -- Update post stats when comments change
    ELSIF TG_TABLE_NAME = 'comments' THEN
        IF TG_OP IN ('INSERT', 'DELETE', 'UPDATE') THEN
            PERFORM update_post_stats(COALESCE(NEW.postId, OLD.postId));
        END IF;
        
    -- Update post stats when bookmarks change
    ELSIF TG_TABLE_NAME = 'bookmarks' THEN
        IF TG_OP IN ('INSERT', 'DELETE') THEN
            PERFORM update_post_stats(COALESCE(NEW.postId, OLD.postId));
        END IF;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER maintain_post_stats_on_reactions
AFTER INSERT OR DELETE ON reactions
FOR EACH ROW
WHEN (NEW.postId IS NOT NULL OR OLD.postId IS NOT NULL)
EXECUTE FUNCTION maintain_post_stats();

CREATE TRIGGER maintain_post_stats_on_comments
AFTER INSERT OR DELETE OR UPDATE OF deleted ON comments
FOR EACH ROW
EXECUTE FUNCTION maintain_post_stats();

CREATE TRIGGER maintain_post_stats_on_bookmarks
AFTER INSERT OR DELETE ON bookmarks
FOR EACH ROW
EXECUTE FUNCTION maintain_post_stats();

-- Verify triggers
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

COMMIT;
