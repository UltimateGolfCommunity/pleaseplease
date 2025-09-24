-- Fix existing tee times with proper dates and course names
-- Run this in your Supabase SQL Editor

-- ===========================================
-- STEP 1: Update tee times with current/future dates
-- ===========================================

-- Update tee time 1 to tomorrow
UPDATE tee_times 
SET 
    tee_time_date = CURRENT_DATE + INTERVAL '1 day',
    tee_time_time = '09:00:00',
    updated_at = NOW()
WHERE id = 'e810e045-3559-4e10-8e63-01271213fedc';

-- Update tee time 2 to day after tomorrow
UPDATE tee_times 
SET 
    tee_time_date = CURRENT_DATE + INTERVAL '2 days',
    tee_time_time = '10:00:00',
    updated_at = NOW()
WHERE id = '7a928841-cb69-4c63-b3ca-cd71a40b6377';

-- Update tee time 3 to 3 days from now
UPDATE tee_times 
SET 
    tee_time_date = CURRENT_DATE + INTERVAL '3 days',
    tee_time_time = '08:00:00',
    updated_at = NOW()
WHERE id = '80c6a963-257f-4f50-b2e7-62acbe7a7d65';

-- Update tee time 4 to 4 days from now
UPDATE tee_times 
SET 
    tee_time_date = CURRENT_DATE + INTERVAL '4 days',
    tee_time_time = '08:00:00',
    updated_at = NOW()
WHERE id = '4abf0b66-d586-4edc-b307-e7e2ba78dc00';

-- ===========================================
-- STEP 2: Fix tee time with null course_id
-- ===========================================

-- Add a course_name for the tee time with null course_id
UPDATE tee_times 
SET 
    course_name = 'Local Golf Course',
    updated_at = NOW()
WHERE id = '80c6a963-257f-4f50-b2e7-62acbe7a7d65' 
AND course_id IS NULL;

-- ===========================================
-- STEP 3: Ensure all tee times have course names
-- ===========================================

-- Update tee times that have course_id but no course_name
UPDATE tee_times 
SET 
    course_name = COALESCE(
        (SELECT gc.name FROM golf_courses gc WHERE gc.id = tee_times.course_id),
        'Golf Course'
    ),
    updated_at = NOW()
WHERE course_name IS NULL OR course_name = '';

-- ===========================================
-- STEP 4: Add a few more sample tee times for better variety
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
    CURRENT_DATE + INTERVAL '5 days',
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
    CURRENT_DATE + INTERVAL '6 days',
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
    CURRENT_DATE + INTERVAL '7 days',
    '14:00:00',
    4,
    1,
    'Any level',
    'Historic round at the home of golf',
    (SELECT id FROM user_profiles LIMIT 1),
    'active',
    NOW(),
    NOW()
);

-- ===========================================
-- STEP 5: Verify the fixes
-- ===========================================

SELECT 
    id,
    course_name,
    tee_time_date,
    tee_time_time,
    max_players,
    current_players,
    (max_players - current_players) as available_spots,
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

-- ===========================================
-- STEP 6: Show summary
-- ===========================================

SELECT 
    COUNT(*) as total_active_tee_times,
    COUNT(CASE WHEN tee_time_date >= CURRENT_DATE THEN 1 END) as future_tee_times,
    COUNT(CASE WHEN course_name IS NOT NULL AND course_name != '' THEN 1 END) as tee_times_with_course_names
FROM tee_times 
WHERE status = 'active';
