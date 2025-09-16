-- Fix tee times with current/future dates
-- Run this in your Supabase SQL Editor

-- ===========================================
-- STEP 1: Delete all existing tee times
-- ===========================================
DELETE FROM tee_times;
DELETE FROM tee_time_applications;

-- ===========================================
-- STEP 2: Insert tee times with current/future dates
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
    (SELECT id FROM user_profiles LIMIT 1),
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
    (SELECT id FROM user_profiles LIMIT 1),
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
    (SELECT id FROM user_profiles LIMIT 1),
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
    (SELECT id FROM user_profiles LIMIT 1),
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
    (SELECT id FROM user_profiles LIMIT 1),
    'active',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'Bethpage Black',
    CURRENT_DATE + INTERVAL '6 days',
    '07:30:00',
    4,
    1,
    'Any level',
    'Challenging round at Bethpage Black',
    (SELECT id FROM user_profiles LIMIT 1),
    'active',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'Pinehurst No. 2',
    CURRENT_DATE + INTERVAL '7 days',
    '13:00:00',
    4,
    1,
    'Handicap 18 or better',
    'Classic Donald Ross design',
    (SELECT id FROM user_profiles LIMIT 1),
    'active',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'Cypress Point Club',
    CURRENT_DATE + INTERVAL '8 days',
    '15:30:00',
    4,
    1,
    'Any level',
    'Exclusive coastal golf experience',
    (SELECT id FROM user_profiles LIMIT 1),
    'active',
    NOW(),
    NOW()
);

-- ===========================================
-- STEP 3: Verify the tee times
-- ===========================================
SELECT 
    COUNT(*) as total_tee_times,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_tee_times,
    COUNT(CASE WHEN tee_time_date >= CURRENT_DATE THEN 1 END) as future_tee_times
FROM tee_times;

-- ===========================================
-- STEP 4: Show the new tee times
-- ===========================================
SELECT 
    id,
    course_name,
    tee_time_date,
    tee_time_time,
    max_players,
    current_players,
    status,
    created_at
FROM tee_times 
WHERE tee_time_date >= CURRENT_DATE
ORDER BY tee_time_date, tee_time_time;
