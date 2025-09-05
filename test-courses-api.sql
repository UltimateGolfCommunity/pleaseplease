-- Test to verify courses are in the database
-- Run this in Supabase SQL Editor to check if courses exist

-- Check if courses exist
SELECT 
    id,
    name,
    location,
    course_type,
    is_active,
    created_at
FROM golf_courses 
ORDER BY created_at DESC
LIMIT 10;

-- Count total courses
SELECT COUNT(*) as total_courses FROM golf_courses;

-- Check if any courses are active
SELECT COUNT(*) as active_courses FROM golf_courses WHERE is_active = true;
