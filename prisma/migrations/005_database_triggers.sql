-- migrations/005_database_triggers.sql
-- Database triggers for automatic data maintenance
-- FIXED: Column name case sensitivity in achievement tracking

-- ... [Previous trigger definitions remain the same] ...

-- =====================================================
-- COMPREHENSIVE ACHIEVEMENT SYSTEM (FIXED)
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
            IF check_achievement_eligibility(NEW."authorId", 'FIRST_POST') THEN
                PERFORM grant_achievement(NEW."authorId", 'FIRST_POST');
            END IF;
            
            -- Check prolific writer (50 posts) - FIXED: use quoted identifier
            SELECT "totalPosts" INTO user_data FROM user_stats WHERE "userId" = NEW."authorId";
            IF user_data."totalPosts" >= 50 AND check_achievement_eligibility(NEW."authorId", 'PROLIFIC_WRITER') THEN
                PERFORM grant_achievement(NEW."authorId", 'PROLIFIC_WRITER');
            END IF;
        END IF;
        
    ELSIF TG_TABLE_NAME = 'follows' THEN
        -- Social achievements - FIXED: use quoted identifiers
        IF TG_OP = 'INSERT' THEN
            SELECT "totalFollowers" INTO user_data FROM user_stats WHERE "userId" = NEW."followingId";
            
            -- First follower
            IF user_data."totalFollowers" = 1 AND check_achievement_eligibility(NEW."followingId", 'FIRST_FOLLOWER') THEN
                PERFORM grant_achievement(NEW."followingId", 'FIRST_FOLLOWER');
            END IF;
            
            -- Social butterfly (100 followers)
            IF user_data."totalFollowers" >= 100 AND check_achievement_eligibility(NEW."followingId", 'SOCIAL_BUTTERFLY') THEN
                PERFORM grant_achievement(NEW."followingId", 'SOCIAL_BUTTERFLY');
            END IF;
            
            -- Influencer (1000 followers)
            IF user_data."totalFollowers" >= 1000 AND check_achievement_eligibility(NEW."followingId", 'INFLUENCER') THEN
                PERFORM grant_achievement(NEW."followingId", 'INFLUENCER');
            END IF;
        END IF;
        
    ELSIF TG_TABLE_NAME = 'user_stats' THEN
        -- Streak achievements - FIXED: use quoted identifier "streakDays"
        IF NEW."streakDays" >= 7 AND OLD."streakDays" < 7 THEN
            IF check_achievement_eligibility(NEW."userId", 'STREAK_WEEK') THEN
                PERFORM grant_achievement(NEW."userId", 'STREAK_WEEK');
            END IF;
        END IF;
        
        IF NEW."streakDays" >= 30 AND OLD."streakDays" < 30 THEN
            IF check_achievement_eligibility(NEW."userId", 'STREAK_MONTH') THEN
                PERFORM grant_achievement(NEW."userId", 'STREAK_MONTH');
            END IF;
        END IF;
        
    ELSIF TG_TABLE_NAME = 'reactions' THEN
        -- Engagement achievements - FIXED: use quoted identifiers
        IF TG_OP = 'INSERT' AND NEW."postId" IS NOT NULL THEN
            -- Get post author
            SELECT "authorId" INTO user_data FROM posts WHERE id = NEW."postId";
            
            -- Update total likes received
            UPDATE user_stats 
            SET "totalLikesReceived" = "totalLikesReceived" + 1
            WHERE "userId" = user_data."authorId";
            
            -- Check likes milestones
            SELECT "totalLikesReceived" INTO user_data FROM user_stats WHERE "userId" = user_data."authorId";
            
            IF user_data."totalLikesReceived" >= 100 AND check_achievement_eligibility(user_data."authorId", 'WELL_LIKED') THEN
                PERFORM grant_achievement(user_data."authorId", 'WELL_LIKED');
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply achievement triggers with correct column names
CREATE TRIGGER track_streak_achievements
AFTER UPDATE OF "streakDays" ON user_stats
FOR EACH ROW
EXECUTE FUNCTION track_achievement_progress();

-- ... [Rest of the triggers remain the same] ...
