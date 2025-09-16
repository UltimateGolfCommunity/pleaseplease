-- Update tee times with current/future dates so they display properly
-- Run this in your Supabase SQL Editor

-- ===========================================
-- Update all tee times to have current/future dates
-- ===========================================

-- Update Augusta National to tomorrow
UPDATE tee_times 
SET 
    tee_time_date = CURRENT_DATE + INTERVAL '1 day',
    tee_time_time = '08:00:00',
    updated_at = NOW()
WHERE course_name = 'Augusta National Golf Club';

-- Update Pebble Beach to day after tomorrow
UPDATE tee_times 
SET 
    tee_time_date = CURRENT_DATE + INTERVAL '2 days',
    tee_time_time = '10:30:00',
    updated_at = NOW()
WHERE course_name = 'Pebble Beach Golf Links';

-- Update St. Andrews to 3 days from now
UPDATE tee_times 
SET 
    tee_time_date = CURRENT_DATE + INTERVAL '3 days',
    tee_time_time = '14:00:00',
    updated_at = NOW()
WHERE course_name = 'St. Andrews Old Course';

-- Update TPC Sawgrass to 4 days from now
UPDATE tee_times 
SET 
    tee_time_date = CURRENT_DATE + INTERVAL '4 days',
    tee_time_time = '09:15:00',
    updated_at = NOW()
WHERE course_name = 'TPC Sawgrass';

-- Update Whistling Straits to 5 days from now
UPDATE tee_times 
SET 
    tee_time_date = CURRENT_DATE + INTERVAL '5 days',
    tee_time_time = '11:45:00',
    updated_at = NOW()
WHERE course_name = 'Whistling Straits';

-- ===========================================
-- Add some additional tee times for this week
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
    1,
    'Any level',
    'Classic Donald Ross design at Pinehurst',
    (SELECT id FROM user_profiles LIMIT 1),
    'active',
    NOW(),
    NOW()
);

-- ===========================================
-- Verify the updates
-- ===========================================
SELECT 
    course_name,
    tee_time_date,
    tee_time_time,
    max_players,
    current_players,
    status,
    CASE 
        WHEN tee_time_date >= CURRENT_DATE THEN 'FUTURE'
        ELSE 'PAST'
    END as date_status
FROM tee_times 
ORDER BY tee_time_date, tee_time_time;

-- ===========================================
-- Show count by date status
-- ===========================================
SELECT 
    COUNT(*) as total_tee_times,
    COUNT(CASE WHEN tee_time_date >= CURRENT_DATE THEN 1 END) as future_tee_times,
    COUNT(CASE WHEN tee_time_date < CURRENT_DATE THEN 1 END) as past_tee_times
FROM tee_times;
