-- Review Courses for Deletion (Preview Only)
-- This script shows you which courses will be deleted without actually deleting them
-- Run this first to review what will be removed

-- Show current courses
SELECT 'CURRENT COURSE INVENTORY:' as status;
SELECT 
    COUNT(*) as total_courses,
    COUNT(CASE WHEN course_image_url != '/logos/golfcoursedefaultimage.png' THEN 1 END) as courses_with_custom_logos,
    COUNT(CASE WHEN course_image_url = '/logos/golfcoursedefaultimage.png' THEN 1 END) as courses_with_default_logos
FROM golf_courses;

-- Show courses that will be KEPT (have custom logos)
SELECT 'COURSES THAT WILL BE KEPT (have custom logos):' as status;
SELECT 
    name,
    location,
    course_type,
    par,
    holes,
    course_image_url,
    logo_url,
    created_at
FROM golf_courses 
WHERE course_image_url != '/logos/golfcoursedefaultimage.png'
ORDER BY name;

-- Show courses that will be DELETED (use default logo)
SELECT 'COURSES THAT WILL BE DELETED (use default logo):' as status;
SELECT 
    name,
    location,
    course_type,
    par,
    holes,
    course_image_url,
    logo_url,
    created_at
FROM golf_courses 
WHERE course_image_url = '/logos/golfcoursedefaultimage.png'
ORDER BY name;

-- Count related data that will be affected
SELECT 'RELATED DATA THAT WILL BE DELETED:' as status;

-- Count course reviews that will be deleted
SELECT 
    'Course Reviews' as data_type,
    COUNT(*) as count_to_delete
FROM course_reviews 
WHERE course_id IN (
    SELECT id FROM golf_courses 
    WHERE course_image_url = '/logos/golfcoursedefaultimage.png'
)

UNION ALL

-- Count tee times that will be deleted
SELECT 
    'Tee Times' as data_type,
    COUNT(*) as count_to_delete
FROM tee_times 
WHERE course_id IN (
    SELECT id FROM golf_courses 
    WHERE course_image_url = '/logos/golfcoursedefaultimage.png'
)

UNION ALL

-- Count tee time applications that will be deleted
SELECT 
    'Tee Time Applications' as data_type,
    COUNT(*) as count_to_delete
FROM tee_time_applications 
WHERE tee_time_id IN (
    SELECT id FROM tee_times 
    WHERE course_id IN (
        SELECT id FROM golf_courses 
        WHERE course_image_url = '/logos/golfcoursedefaultimage.png'
    )
)

UNION ALL

-- Count golf rounds that will be deleted
SELECT 
    'Golf Rounds' as data_type,
    COUNT(*) as count_to_delete
FROM golf_rounds 
WHERE course_id IN (
    SELECT id FROM golf_courses 
    WHERE course_image_url = '/logos/golfcoursedefaultimage.png'
);

-- Summary
SELECT 'SUMMARY - After deletion you will have:' as status;
SELECT 
    COUNT(CASE WHEN course_image_url != '/logos/golfcoursedefaultimage.png' THEN 1 END) as remaining_courses_with_logos,
    'courses with custom logos remaining' as description
FROM golf_courses;
