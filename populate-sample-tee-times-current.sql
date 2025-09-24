-- Populate database with sample tee times using current dates
-- Run this in your Supabase SQL Editor

-- ===========================================
-- STEP 1: Clean up any existing tee times (optional)
-- ===========================================
-- Uncomment the following lines if you want to start fresh:
-- DELETE FROM tee_times;
-- DELETE FROM tee_time_applications;

-- ===========================================
-- STEP 2: Insert fresh sample tee times with current dates
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
    2,
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
    3,
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
    3,
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
    'Torrey Pines Golf Course',
    CURRENT_DATE + INTERVAL '7 days',
    '12:00:00',
    4,
    1,
    'Handicap 25 or better',
    'Beautiful coastal golf at Torrey Pines',
    (SELECT id FROM user_profiles LIMIT 1),
    'active',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'Pinehurst No. 2',
    CURRENT_DATE + INTERVAL '8 days',
    '15:30:00',
    4,
    2,
    'Any level',
    'Classic Donald Ross design at Pinehurst',
    (SELECT id FROM user_profiles LIMIT 1),
    'active',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'Cypress Point Club',
    CURRENT_DATE + INTERVAL '9 days',
    '13:15:00',
    4,
    1,
    'Handicap 10 or better',
    'Exclusive round at Cypress Point',
    (SELECT id FROM user_profiles LIMIT 1),
    'active',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'Oakmont Country Club',
    CURRENT_DATE + INTERVAL '10 days',
    '10:00:00',
    4,
    1,
    'Any level',
    'Championship golf at Oakmont',
    (SELECT id FROM user_profiles LIMIT 1),
    'active',
    NOW(),
    NOW()
);

-- ===========================================
-- STEP 3: Verify the tee times were created
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
    course_name,
    tee_time_date,
    tee_time_time,
    max_players,
    current_players,
    (max_players - current_players) as available_spots,
    handicap_requirement,
    status,
    CASE 
        WHEN tee_time_date = CURRENT_DATE THEN 'TODAY'
        WHEN tee_time_date = CURRENT_DATE + INTERVAL '1 day' THEN 'TOMORROW'
        WHEN tee_time_date > CURRENT_DATE THEN 'FUTURE'
        ELSE 'PAST'
    END as date_status
FROM tee_times 
WHERE status = 'active'
ORDER BY tee_time_date, tee_time_time;
