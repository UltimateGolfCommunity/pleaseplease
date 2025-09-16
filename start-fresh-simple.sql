-- START FRESH: Simple Clean Database Script
-- Run this in your Supabase SQL Editor to clear existing data and start fresh

-- ===========================================
-- STEP 1: Clear tee time related data (only if tables exist)
-- ===========================================
DELETE FROM tee_time_applications;
DELETE FROM tee_times;

-- ===========================================
-- STEP 2: Clear user connections (only if table exists)
-- ===========================================
DELETE FROM user_connections;

-- ===========================================
-- STEP 3: Clear group related data (only if tables exist)
-- ===========================================
DELETE FROM group_invitations;
DELETE FROM group_members;
DELETE FROM golf_groups;

-- ===========================================
-- STEP 4: Clear messaging data (only if table exists)
-- ===========================================
DELETE FROM direct_messages;

-- ===========================================
-- STEP 5: Clear notifications (only if table exists)
-- ===========================================
DELETE FROM notifications;

-- ===========================================
-- STEP 6: Clear badge and achievement data (only if tables exist)
-- ===========================================
DELETE FROM user_achievements;
DELETE FROM user_badges;

-- ===========================================
-- STEP 7: Insert fresh sample tee times with proper relationships
-- ===========================================
INSERT INTO tee_times (
    id,
    course_name,
    tee_time_date,
    tee_time_time,
    max_players,
    current_players,
    handicap_requirement,
    description,
    creator_id,
    status,
    created_at,
    updated_at
) VALUES 
(
    gen_random_uuid(),
    'Augusta National Golf Club',
    CURRENT_DATE + INTERVAL '1 day',
    '08:00:00',
    4,
    1,
    'Any level',
    'Early morning round at Augusta National',
    (SELECT id FROM user_profiles ORDER BY created_at DESC LIMIT 1),
    'active',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'Pebble Beach Golf Links',
    CURRENT_DATE + INTERVAL '2 days',
    '10:30:00',
    4,
    1,
    'Handicap 20 or better',
    'Beautiful coastal golf at Pebble Beach',
    (SELECT id FROM user_profiles ORDER BY created_at DESC LIMIT 1),
    'active',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'St. Andrews Old Course',
    CURRENT_DATE + INTERVAL '3 days',
    '14:00:00',
    4,
    1,
    'Any level',
    'Historic round at the home of golf',
    (SELECT id FROM user_profiles ORDER BY created_at DESC LIMIT 1),
    'active',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'TPC Sawgrass',
    CURRENT_DATE + INTERVAL '4 days',
    '09:15:00',
    4,
    1,
    'Handicap 15 or better',
    'Challenging round at TPC Sawgrass',
    (SELECT id FROM user_profiles ORDER BY created_at DESC LIMIT 1),
    'active',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'Whistling Straits',
    CURRENT_DATE + INTERVAL '5 days',
    '11:45:00',
    4,
    1,
    'Any level',
    'Links-style golf on Lake Michigan',
    (SELECT id FROM user_profiles ORDER BY created_at DESC LIMIT 1),
    'active',
    NOW(),
    NOW()
);

-- ===========================================
-- STEP 8: Verify the cleanup and new data
-- ===========================================
SELECT 
    'Tee Times' as table_name,
    COUNT(*) as record_count
FROM tee_times
UNION ALL
SELECT 
    'Tee Time Applications' as table_name,
    COUNT(*) as record_count
FROM tee_time_applications
UNION ALL
SELECT 
    'User Connections' as table_name,
    COUNT(*) as record_count
FROM user_connections
UNION ALL
SELECT 
    'Golf Groups' as table_name,
    COUNT(*) as record_count
FROM golf_groups
UNION ALL
SELECT 
    'Direct Messages' as table_name,
    COUNT(*) as record_count
FROM direct_messages
UNION ALL
SELECT 
    'Notifications' as table_name,
    COUNT(*) as record_count
FROM notifications;

-- ===========================================
-- STEP 9: Show the new tee times
-- ===========================================
SELECT 
    tt.id,
    tt.course_name,
    tt.tee_time_date,
    tt.tee_time_time,
    tt.max_players,
    tt.current_players,
    tt.status,
    up.first_name,
    up.last_name,
    up.username
FROM tee_times tt
LEFT JOIN user_profiles up ON tt.creator_id = up.id
WHERE tt.tee_time_date >= CURRENT_DATE
ORDER BY tt.tee_time_date, tt.tee_time_time;
