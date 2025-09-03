-- Founding Member Badge for First 20 Users
-- Run this in your Supabase SQL Editor

-- 1. First, ensure we have the necessary tables and constraints
DO $$
BEGIN
  -- Add unique constraint on badge name if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'badges_name_key' 
    AND conrelid = 'badges'::regclass
  ) THEN
    ALTER TABLE badges ADD CONSTRAINT badges_name_key UNIQUE (name);
  END IF;
  
  -- Add unique constraint on user_badges if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_badges_user_id_badge_id_key' 
    AND conrelid = 'user_badges'::regclass
  ) THEN
    ALTER TABLE user_badges ADD CONSTRAINT user_badges_user_id_badge_id_key UNIQUE (user_id, badge_id);
  END IF;
END $$;

-- 2. Insert/Update the Founding Member badge for first 20 users
INSERT INTO badges (name, description, icon_name, category, points, rarity, criteria) 
SELECT 
  'Founding Member',
  'One of the first 20 members to join the Ultimate Golf Community. A true pioneer and founding member!',
  'crown',
  'early_adopter',
  150, -- Higher points for being in first 20
  'legendary',
  'Joined within the first 20 users'
WHERE NOT EXISTS (
  SELECT 1 FROM badges WHERE name = 'Founding Member'
);

-- Update existing badge if it exists to reflect first 20 instead of 50
UPDATE badges 
SET 
  description = 'One of the first 20 members to join the Ultimate Golf Community. A true pioneer and founding member!',
  criteria = 'Joined within the first 20 users',
  points = 150
WHERE name = 'Founding Member';

-- 3. Create a function to check if user should get the Founding Member badge (first 20)
CREATE OR REPLACE FUNCTION check_founding_member_badge()
RETURNS TRIGGER AS $$
DECLARE
  founding_badge_id UUID;
  user_position INTEGER;
BEGIN
  -- Get the user's position based on created_at (registration order)
  SELECT COUNT(*) + 1 INTO user_position
  FROM user_profiles 
  WHERE created_at < NEW.created_at;
  
  -- Check if this user is in the first 20
  IF user_position <= 20 THEN
    -- Get the Founding Member badge ID
    SELECT id INTO founding_badge_id FROM badges WHERE name = 'Founding Member';
    
    -- Award the badge if it doesn't already exist for this user
    IF founding_badge_id IS NOT NULL THEN
      INSERT INTO user_badges (user_id, badge_id, earned_reason)
      SELECT 
        NEW.id, 
        founding_badge_id, 
        'Founding Member #' || user_position || ' - One of the first 20 pioneers!'
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

-- 5. Award the badge to existing users who are in the first 20 (ordered by created_at)
DO $$
DECLARE
  founding_badge_id UUID;
  awarded_count INTEGER;
BEGIN
  -- Get the Founding Member badge ID
  SELECT id INTO founding_badge_id FROM badges WHERE name = 'Founding Member';
  
  IF founding_badge_id IS NOT NULL THEN
    -- Award badge to the first 20 existing users (ordered by created_at)
    WITH first_20_users AS (
      SELECT 
        id, 
        ROW_NUMBER() OVER (ORDER BY created_at ASC) as user_position
      FROM user_profiles
      ORDER BY created_at ASC
      LIMIT 20
    )
    INSERT INTO user_badges (user_id, badge_id, earned_reason)
    SELECT 
      f20.id, 
      founding_badge_id, 
      'Founding Member #' || f20.user_position || ' - One of the first 20 pioneers!'
    FROM first_20_users f20
    WHERE NOT EXISTS (
      SELECT 1 FROM user_badges ub 
      WHERE ub.user_id = f20.id AND ub.badge_id = founding_badge_id
    );
    
    GET DIAGNOSTICS awarded_count = ROW_COUNT;
    RAISE NOTICE 'Awarded Founding Member badge to % users in the first 20', awarded_count;
  END IF;
END $$;

-- 6. Create a function to manually award founding member badge (for admin use)
CREATE OR REPLACE FUNCTION award_founding_member_badge(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  founding_badge_id UUID;
  user_position INTEGER;
  user_exists BOOLEAN;
BEGIN
  -- Check if user exists
  SELECT EXISTS(SELECT 1 FROM user_profiles WHERE id = target_user_id) INTO user_exists;
  
  IF NOT user_exists THEN
    RAISE NOTICE 'User % does not exist', target_user_id;
    RETURN FALSE;
  END IF;
  
  -- Get the Founding Member badge ID
  SELECT id INTO founding_badge_id FROM badges WHERE name = 'Founding Member';
  
  IF founding_badge_id IS NULL THEN
    RAISE NOTICE 'Founding Member badge does not exist';
    RETURN FALSE;
  END IF;
  
  -- Check if user already has the badge
  IF EXISTS(SELECT 1 FROM user_badges WHERE user_id = target_user_id AND badge_id = founding_badge_id) THEN
    RAISE NOTICE 'User already has the Founding Member badge';
    RETURN FALSE;
  END IF;
  
  -- Get user's registration position
  SELECT position INTO user_position FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as position
    FROM user_profiles
  ) ranked WHERE id = target_user_id;
  
  -- Award the badge
  INSERT INTO user_badges (user_id, badge_id, earned_reason)
  VALUES (
    target_user_id, 
    founding_badge_id, 
    'Founding Member #' || user_position || ' - Manually awarded'
  );
  
  RAISE NOTICE 'Successfully awarded Founding Member badge to user %', target_user_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 7. Verification queries
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

-- Show the badge details
SELECT 
  'Badge Details' as info,
  b.name,
  b.description,
  b.rarity,
  b.points,
  b.category,
  b.criteria
FROM badges b 
WHERE b.name = 'Founding Member';

-- Show current badge recipients with their position
SELECT 
  'Current Badge Recipients' as info,
  up.first_name,
  up.last_name,
  up.username,
  ub.earned_reason,
  ub.earned_at,
  ROW_NUMBER() OVER (ORDER BY up.created_at ASC) as registration_order
FROM user_profiles up
JOIN user_badges ub ON up.id = ub.user_id
JOIN badges b ON ub.badge_id = b.id AND b.name = 'Founding Member'
ORDER BY up.created_at ASC;
