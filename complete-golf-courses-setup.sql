-- Complete Golf Courses Setup Script
-- Run this in your Supabase SQL Editor to set up the entire golf course system

-- Step 1: Run the enhanced schema first
-- (Copy and paste the contents of enhance-golf-courses-schema.sql here)

-- Step 2: Populate with 100 real golf courses
-- (Copy and paste the contents of populate-golf-courses.sql here)

-- Step 3: Add more courses
-- (Copy and paste the contents of populate-golf-courses-part2.sql here)

-- Step 4: Complete the 100 courses
-- (Copy and paste the contents of populate-golf-courses-part3.sql here)

-- Step 5: Create sample reviews for some courses
INSERT INTO course_reviews (course_id, user_id, rating, comment, created_at)
SELECT 
    gc.id,
    up.id,
    CASE 
        WHEN RANDOM() < 0.2 THEN 5
        WHEN RANDOM() < 0.4 THEN 4
        WHEN RANDOM() < 0.6 THEN 3
        WHEN RANDOM() < 0.8 THEN 2
        ELSE 1
    END,
    CASE 
        WHEN RANDOM() < 0.2 THEN 'Absolutely incredible course! The views are breathtaking and the challenge is perfect.'
        WHEN RANDOM() < 0.4 THEN 'Great course with excellent conditions. Highly recommend for any golfer.'
        WHEN RANDOM() < 0.6 THEN 'Good course overall. Some holes are challenging but fair.'
        WHEN RANDOM() < 0.8 THEN 'Decent course but could use some improvements in maintenance.'
        ELSE 'Not my favorite. Course conditions were poor and staff was unfriendly.'
    END,
    NOW() - (RANDOM() * INTERVAL '30 days')
FROM golf_courses gc
CROSS JOIN user_profiles up
WHERE gc.name IN ('Pebble Beach Golf Links', 'Augusta National Golf Club', 'St. Andrews Old Course', 'Cypress Point Club', 'Pine Valley Golf Club')
AND up.id IS NOT NULL
LIMIT 25;

-- Step 6: Create sample tee times for some courses
INSERT INTO course_tee_times (course_id, tee_time_date, tee_time_time, available_spots, price_per_person, is_booked, booking_notes)
SELECT 
    gc.id,
    CURRENT_DATE + (RANDOM() * INTERVAL '30 days'),
    '08:00'::TIME + (RANDOM() * INTERVAL '10 hours'),
    CASE 
        WHEN RANDOM() < 0.5 THEN 4
        WHEN RANDOM() < 0.8 THEN 2
        ELSE 1
    END,
    CASE 
        WHEN gc.green_fees_min > 0 THEN gc.green_fees_min + (RANDOM() * (gc.green_fees_max - gc.green_fees_min))
        ELSE 100 + (RANDOM() * 200)
    END,
    RANDOM() < 0.3,
    CASE 
        WHEN RANDOM() < 0.3 THEN 'Early morning tee time with great conditions'
        WHEN RANDOM() < 0.6 THEN 'Prime time slot with excellent course conditions'
        ELSE 'Afternoon tee time with challenging wind conditions'
    END
FROM golf_courses gc
WHERE gc.name IN ('Pebble Beach Golf Links', 'Augusta National Golf Club', 'St. Andrews Old Course', 'Cypress Point Club', 'Pine Valley Golf Club')
LIMIT 50;

-- Step 7: Create sample course management records
INSERT INTO course_management (course_id, manager_id, role, permissions, is_active)
SELECT 
    gc.id,
    up.id,
    CASE 
        WHEN RANDOM() < 0.3 THEN 'owner'
        WHEN RANDOM() < 0.6 THEN 'manager'
        ELSE 'staff'
    END,
    '{"can_edit_course": true, "can_manage_photos": true, "can_manage_amenities": true, "can_manage_tee_times": true}',
    true
FROM golf_courses gc
CROSS JOIN user_profiles up
WHERE gc.name IN ('Pebble Beach Golf Links', 'Augusta National Golf Club', 'St. Andrews Old Course', 'Cypress Point Club', 'Pine Valley Golf Club')
AND up.id IS NOT NULL
LIMIT 15;

-- Step 8: Verify everything was created successfully
SELECT 
    'Setup Complete!' AS status,
    (SELECT COUNT(*) FROM golf_courses) AS total_courses,
    (SELECT COUNT(*) FROM course_photos) AS total_photos,
    (SELECT COUNT(*) FROM course_amenities) AS total_amenities,
    (SELECT COUNT(*) FROM course_holes) AS total_holes,
    (SELECT COUNT(*) FROM course_reviews) AS total_reviews,
    (SELECT COUNT(*) FROM course_tee_times) AS total_tee_times,
    (SELECT COUNT(*) FROM course_management) AS total_management_records;

-- Step 9: Show sample of created courses
SELECT 
    name,
    location,
    course_type,
    green_fees_min,
    green_fees_max,
    is_featured,
    course_image_url
FROM golf_courses 
ORDER BY is_featured DESC, name
LIMIT 10;
