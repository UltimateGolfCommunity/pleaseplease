-- Clean up old tee times and start fresh
-- Run this in your Supabase SQL Editor

-- ===========================================
-- STEP 1: Delete all existing tee times
-- ===========================================
DELETE FROM tee_times;

-- ===========================================
-- STEP 2: Delete all tee time applications
-- ===========================================
DELETE FROM tee_time_applications;

-- ===========================================
-- STEP 3: Reset any sequences (if they exist)
-- ===========================================
-- Note: This will reset auto-incrementing IDs if your table uses them
-- Uncomment the following lines if you have sequences:
-- ALTER SEQUENCE tee_times_id_seq RESTART WITH 1;
-- ALTER SEQUENCE tee_time_applications_id_seq RESTART WITH 1;

-- ===========================================
-- STEP 4: Insert some fresh sample tee times
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
    '2024-12-20',
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
    '2024-12-21',
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
    '2024-12-22',
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
    '2024-12-23',
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
    '2024-12-24',
    '11:45:00',
    4,
    1,
    'Any level',
    'Links-style golf on Lake Michigan',
    (SELECT id FROM user_profiles LIMIT 1),
    'active',
    NOW(),
    NOW()
);

-- ===========================================
-- STEP 5: Verify the cleanup worked
-- ===========================================
SELECT 
    COUNT(*) as total_tee_times,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_tee_times,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_tee_times,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tee_times
FROM tee_times;

-- ===========================================
-- STEP 6: Show the new tee times
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
ORDER BY tee_time_date, tee_time_time;
