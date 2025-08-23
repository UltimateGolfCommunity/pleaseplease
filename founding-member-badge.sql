-- Founding Member Badge Setup
-- Run this in your Supabase SQL Editor

-- 1. Insert the Founding Member badge
INSERT INTO badges (name, description, icon_name, category, points, rarity, criteria) 
VALUES (
  'Founding Member',
  'One of the first 50 members to join the Ultimate Golf Community. A true pioneer!',
  'crown', -- or 'star' or 'trophy'
  'early_adopter',
  100,
  'legendary',
  'Joined within the first 50 users'
) ON CONFLICT (name) DO NOTHING;

-- 2. Create a function to check if user should get the Founding Member badge
CREATE OR REPLACE FUNCTION check_founding_member_badge()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is one of the first 50 users
  IF (SELECT COUNT(*) FROM user_profiles) <= 50 THEN
    -- Get the Founding Member badge ID
    DECLARE
      founding_badge_id UUID;
    BEGIN
      SELECT id INTO founding_badge_id FROM badges WHERE name = 'Founding Member';
      
      -- Award the badge if it doesn't already exist for this user
      INSERT INTO user_badges (user_id, badge_id, earned_reason)
      VALUES (
        NEW.id, 
        founding_badge_id, 
        'One of the first 50 founding members!'
      )
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create a trigger to automatically award the badge when a new user profile is created
DROP TRIGGER IF EXISTS trigger_founding_member_badge ON user_profiles;
CREATE TRIGGER trigger_founding_member_badge
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_founding_member_badge();

-- 4. Award the badge to existing users (if you have any already)
-- This will award it to existing users who are within the first 50
DO $$
DECLARE
  founding_badge_id UUID;
  user_count INTEGER;
BEGIN
  -- Get the Founding Member badge ID
  SELECT id INTO founding_badge_id FROM badges WHERE name = 'Founding Member';
  
  -- Get current user count
  SELECT COUNT(*) INTO user_count FROM user_profiles;
  
  -- Award badge to existing users if they're within the first 50
  IF user_count <= 50 THEN
    INSERT INTO user_badges (user_id, badge_id, earned_reason)
    SELECT 
      up.id, 
      founding_badge_id, 
      'One of the first 50 founding members!'
    FROM user_profiles up
    WHERE NOT EXISTS (
      SELECT 1 FROM user_badges ub 
      WHERE ub.user_id = up.id AND ub.badge_id = founding_badge_id
    )
    ON CONFLICT (user_id, badge_id) DO NOTHING;
    
    RAISE NOTICE 'Awarded Founding Member badge to % existing users', user_count;
  END IF;
END $$;

-- 5. Verify the setup
SELECT 
  'Founding Member Badge Created' as status,
  b.name,
  b.description,
  b.rarity,
  b.points
FROM badges b 
WHERE b.name = 'Founding Member';

-- 6. Check current user count and badge awards
SELECT 
  'Current Status' as info,
  COUNT(DISTINCT up.id) as total_users,
  COUNT(DISTINCT ub.user_id) as users_with_founding_badge
FROM user_profiles up
LEFT JOIN user_badges ub ON up.id = ub.user_id
LEFT JOIN badges b ON ub.badge_id = b.id AND b.name = 'Founding Member';
