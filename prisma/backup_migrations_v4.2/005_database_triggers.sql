-- migrations/005_database_triggers.sql
-- Database triggers for automatic data maintenance

-- Trigger 1: Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updatedAt (selective list shown)
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger 2: Update denormalized counts
CREATE OR REPLACE FUNCTION update_user_post_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE user_stats 
        SET totalPosts = totalPosts + 1
        WHERE userId = NEW.authorId;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE user_stats 
        SET totalPosts = totalPosts - 1
        WHERE userId = OLD.authorId;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER maintain_user_post_count
AFTER INSERT OR DELETE ON posts
FOR EACH ROW 
WHEN (NEW.published = true OR OLD.published = true)
EXECUTE FUNCTION update_user_post_count();

-- Trigger 3: Level progression checks
CREATE OR REPLACE FUNCTION check_user_level_progression()
RETURNS TRIGGER AS $$
DECLARE
    new_level INT;
    current_level INT;
BEGIN
    -- Calculate new level
    new_level := calculate_user_level(NEW.experience);
    current_level := OLD.level;
    
    -- Update level if changed
    IF new_level > current_level THEN
        NEW.level := new_level;
        
        -- Create notification for level up
        INSERT INTO notifications (
            type, userId, title, message, 
            priority, createdAt
        ) VALUES (
            'LEVEL_UP', 
            NEW.id,
            'Level Up!',
            'Congratulations! You reached level ' || new_level || '!',
            1,
            NOW()
        );
        
        -- Log XP event
        INSERT INTO xp_logs (
            userId, amount, source, reason, 
            totalXp, createdAt
        ) VALUES (
            NEW.id,
            0,
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

-- Trigger 4: Achievement progress tracking
CREATE OR REPLACE FUNCTION track_achievement_progress()
RETURNS TRIGGER AS $$
DECLARE
    achievement RECORD;
    current_progress FLOAT;
BEGIN
    -- Example: Check "First Post" achievement
    IF TG_TABLE_NAME = 'posts' AND TG_OP = 'INSERT' THEN
        -- Check if user already has the achievement
        SELECT * INTO achievement
        FROM achievements a
        WHERE a.code = 'FIRST_POST'
            AND NOT EXISTS (
                SELECT 1 FROM user_achievements ua
                WHERE ua.userId = NEW.authorId
                    AND ua.achievementId = a.id
            );
        
        IF FOUND THEN
            -- Grant achievement
            INSERT INTO user_achievements (
                userId, achievementId, progress,
                unlockedAt, notified
            ) VALUES (
                NEW.authorId,
                achievement.id,
                1.0,
                NOW(),
                false
            );
            
            -- Create notification
            INSERT INTO notifications (
                type, userId, entityId, entityType,
                title, message, priority
            ) VALUES (
                'ACHIEVEMENT_UNLOCKED',
                NEW.authorId,
                achievement.id,
                'achievement',
                'Achievement Unlocked!',
                'You unlocked: ' || achievement.name,
                1
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_post_achievements
AFTER INSERT ON posts
FOR EACH ROW
WHEN (NEW.published = true)
EXECUTE FUNCTION track_achievement_progress();

-- Verify triggers
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
