-- Founding Member Badge Setup - Step by Step
-- Run each section separately in Supabase SQL Editor

-- ===========================================
-- STEP 1: Check Prerequisites
-- ===========================================
-- Run this first to make sure tables exist
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'badges') 
    THEN 'badges table exists ✓' 
    ELSE 'badges table missing ✗' 
  END as badges_table,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_badges') 
    THEN 'user_badges table exists ✓' 
    ELSE 'user_badges table missing ✗' 
  END as user_badges_table,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') 
    THEN 'user_profiles table exists ✓' 
    ELSE 'user_profiles table missing ✗' 
  END as user_profiles_table;

-- ===========================================
-- STEP 2: Create the Founding Member Badge
-- ===========================================
-- Run this to create the badge
INSERT INTO badges (name, description, icon_name, category, points, rarity, criteria) 
SELECT 
  'Founding Member',
  'One of the first 20 members to join the Ultimate Golf Community. A true pioneer and founding member!',
  'crown',
  'early_adopter',
  150,
  'legendary',
  'Joined within the first 20 users'
WHERE NOT EXISTS (
  SELECT 1 FROM badges WHERE name = 'Founding Member'
);

-- Verify the badge was created
SELECT 'Badge Created' as status, * FROM badges WHERE name = 'Founding Member';

-- ===========================================
-- STEP 3: Award to Existing Users (First 20)
-- ===========================================
-- Run this to award badges to the first 20 existing users
WITH first_20_users AS (
  SELECT 
    id, 
    first_name,
    last_name,
    username,
    created_at,
    ROW_NUMBER() OVER (ORDER BY created_at ASC) as user_position
  FROM user_profiles
  ORDER BY created_at ASC
  LIMIT 20
),
founding_badge AS (
  SELECT id as badge_id FROM badges WHERE name = 'Founding Member'
)
INSERT INTO user_badges (user_id, badge_id, earned_reason)
SELECT 
  f20.id, 
  fb.badge_id, 
  'Founding Member #' || f20.user_position || ' - One of the first 20 pioneers!'
FROM first_20_users f20, founding_badge fb
WHERE NOT EXISTS (
  SELECT 1 FROM user_badges ub 
  WHERE ub.user_id = f20.id AND ub.badge_id = fb.badge_id
);

-- ===========================================
-- STEP 4: Verify Results
-- ===========================================
-- Run this to see who got badges
SELECT 
  'Founding Member Recipients' as info,
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

-- ===========================================
-- STEP 5: Check Summary
-- ===========================================
-- Run this to get a summary
SELECT 
  COUNT(DISTINCT up.id) as total_users,
  COUNT(DISTINCT ub.user_id) as users_with_founding_badge,
  CASE 
    WHEN COUNT(DISTINCT ub.user_id) > 0 
    THEN '✓ Founding Member badges awarded successfully!' 
    ELSE '✗ No founding member badges found' 
  END as status
FROM user_profiles up
LEFT JOIN user_badges ub ON up.id = ub.user_id
LEFT JOIN badges b ON ub.badge_id = b.id AND b.name = 'Founding Member';
