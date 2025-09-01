-- Founding Member Badge Setup (Fixed Version)
-- Run this in your Supabase SQL Editor

-- 1. First, ensure we have the necessary unique constraints
-- Add unique constraint on badge name if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'badges_name_key' 
    AND conrelid = 'badges'::regclass
  ) THEN
    ALTER TABLE badges ADD CONSTRAINT badges_name_key UNIQUE (name);
  END IF;
END $$;

-- Add unique constraint on user_badges if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_badges_user_id_badge_id_key' 
    AND conrelid = 'user_badges'::regclass
  ) THEN
    ALTER TABLE user_badges ADD CONSTRAINT user_badges_user_id_badge_id_key UNIQUE (user_id, badge_id);
  END IF;
END $$;

-- 2. Insert the Founding Member badge (with proper conflict handling)
INSERT INTO badges (name, description, icon_name, category, points, rarity, criteria) 
SELECT 
  'Founding Member',
  'One of the first 50 members to join the Ultimate Golf Community. A true pioneer!',
  'crown',
  'early_adopter',
  100,
  'legendary',
  'Joined within the first 50 users'
WHERE NOT EXISTS (
  SELECT 1 FROM badges WHERE name = 'Founding Member'
);

-- 3. Create a function to check if user should get the Founding Member badge
CREATE OR REPLACE FUNCTION check_founding_member_badge()
RETURNS TRIGGER AS $$
DECLARE
  founding_badge_id UUID;
BEGIN
  -- Check if this is one of the first 50 users
  IF (SELECT COUNT(*) FROM user_profiles) <= 50 THEN
    -- Get the Founding Member badge ID
    SELECT id INTO founding_badge_id FROM badges WHERE name = 'Founding Member';
    
    -- Award the badge if it doesn't already exist for this user
    IF founding_badge_id IS NOT NULL THEN
      INSERT INTO user_badges (user_id, badge_id, earned_reason)
      SELECT 
        NEW.id, 
        founding_badge_id, 
        'One of the first 50 founding members!'
      WHERE NOT EXISTS (
        SELECT 1 FROM user_badges 
        WHERE user_id = NEW.id AND badge_id = founding_badge_id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create a trigger to automatically award the badge when a new user profile is created
DROP TRIGGER IF EXISTS trigger_founding_member_badge ON user_profiles;
CREATE TRIGGER trigger_founding_member_badge
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_founding_member_badge();

-- 5. Award the badge to existing users (if you have any already)
DO $$
DECLARE
  founding_badge_id UUID;
  user_count INTEGER;
  awarded_count INTEGER;
BEGIN
  -- Get the Founding Member badge ID
  SELECT id INTO founding_badge_id FROM badges WHERE name = 'Founding Member';
  
  -- Get current user count
  SELECT COUNT(*) INTO user_count FROM user_profiles;
  
  -- Award badge to existing users if they're within the first 50
  IF user_count <= 50 AND founding_badge_id IS NOT NULL THEN
    INSERT INTO user_badges (user_id, badge_id, earned_reason)
    SELECT 
      up.id, 
      founding_badge_id, 
      'One of the first 50 founding members!'
    FROM user_profiles up
    WHERE NOT EXISTS (
      SELECT 1 FROM user_badges ub 
      WHERE ub.user_id = up.id AND ub.badge_id = founding_badge_id
    );
    
    GET DIAGNOSTICS awarded_count = ROW_COUNT;
    RAISE NOTICE 'Awarded Founding Member badge to % existing users', awarded_count;
  END IF;
END $$;

-- 6. Verify the setup
SELECT 
  'Founding Member Badge Status' as info,
  CASE 
    WHEN EXISTS (SELECT 1 FROM badges WHERE name = 'Founding Member') 
    THEN 'Created Successfully' 
    ELSE 'Not Found' 
  END as badge_status,
  COUNT(DISTINCT up.id) as total_users,
  COUNT(DISTINCT ub.user_id) as users_with_founding_badge
FROM user_profiles up
LEFT JOIN user_badges ub ON up.id = ub.user_id
LEFT JOIN badges b ON ub.badge_id = b.id AND b.name = 'Founding Member';

-- 7. Show the badge details
SELECT 
  'Badge Details' as info,
  b.name,
  b.description,
  b.rarity,
  b.points,
  b.category
FROM badges b 
WHERE b.name = 'Founding Member';
