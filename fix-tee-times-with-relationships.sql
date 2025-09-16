-- Fix tee times with proper relationships to user_profiles and golf_courses
-- Run this in your Supabase SQL Editor

-- ===========================================
-- STEP 1: Delete all existing tee times
-- ===========================================
DELETE FROM tee_times;
DELETE FROM tee_time_applications;

-- ===========================================
-- STEP 2: Get a valid user profile ID for creator
-- ===========================================
-- First, let's see what user profiles exist
SELECT id, first_name, last_name, username FROM user_profiles LIMIT 5;

-- ===========================================
-- STEP 3: Insert tee times with proper creator_id
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
    (SELECT id FROM user_profiles ORDER BY created_at DESC LIMIT 1),
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
    (SELECT id FROM user_profiles ORDER BY created_at DESC LIMIT 1),
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
    (SELECT id FROM user_profiles ORDER BY created_at DESC LIMIT 1),
    'active',
    NOW(),
    NOW()
);

-- ===========================================
-- STEP 4: Verify the tee times with relationships
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

-- ===========================================
-- STEP 5: Test the API query structure
-- ===========================================
SELECT 
    tt.*,
    json_build_object(
        'id', up.id,
        'first_name', up.first_name,
        'last_name', up.last_name,
        'avatar_url', up.avatar_url
    ) as creator,
    json_build_object(
        'name', gc.name,
        'location', gc.location,
        'course_image_url', gc.course_image_url,
        'logo_url', gc.logo_url,
        'latitude', gc.latitude,
        'longitude', gc.longitude
    ) as golf_courses
FROM tee_times tt
LEFT JOIN user_profiles up ON tt.creator_id = up.id
LEFT JOIN golf_courses gc ON tt.course_id = gc.id
WHERE tt.status = 'active' 
  AND tt.tee_time_date >= CURRENT_DATE
ORDER BY tt.tee_time_date, tt.tee_time_time;
