-- Delete Courses Without Custom Logos
-- This script deletes all golf courses that are using the default logo image
-- and keeps only courses that have custom logos from the logos folder

-- Show current courses before deletion
SELECT 'BEFORE DELETION - Current courses:' as status;
SELECT 
    COUNT(*) as total_courses,
    COUNT(CASE WHEN course_image_url != '/logos/golfcoursedefaultimage.png' THEN 1 END) as courses_with_custom_logos,
    COUNT(CASE WHEN course_image_url = '/logos/golfcoursedefaultimage.png' THEN 1 END) as courses_with_default_logos
FROM golf_courses;

-- Show which courses will be kept (have custom logos)
SELECT 'COURSES TO KEEP (with custom logos):' as status;
SELECT 
    name,
    location,
    course_type,
    course_image_url,
    logo_url
FROM golf_courses 
WHERE course_image_url != '/logos/golfcoursedefaultimage.png'
ORDER BY name;

-- Show which courses will be deleted (using default logo)
SELECT 'COURSES TO DELETE (using default logo):' as status;
SELECT 
    name,
    location,
    course_type,
    course_image_url,
    logo_url
FROM golf_courses 
WHERE course_image_url = '/logos/golfcoursedefaultimage.png'
ORDER BY name;

-- Step 1: Delete course reviews for courses that will be deleted
DELETE FROM course_reviews 
WHERE course_id IN (
    SELECT id FROM golf_courses 
    WHERE course_image_url = '/logos/golfcoursedefaultimage.png'
);

-- Step 2: Delete tee times associated with courses that will be deleted
DELETE FROM tee_times 
WHERE course_id IN (
    SELECT id FROM golf_courses 
    WHERE course_image_url = '/logos/golfcoursedefaultimage.png'
);

-- Step 3: Delete tee time applications for deleted tee times
DELETE FROM tee_time_applications 
WHERE tee_time_id IN (
    SELECT id FROM tee_times 
    WHERE course_id IN (
        SELECT id FROM golf_courses 
        WHERE course_image_url = '/logos/golfcoursedefaultimage.png'
    )
);

-- Step 4: Finally, delete the courses that use the default logo
DELETE FROM golf_courses 
WHERE course_image_url = '/logos/golfcoursedefaultimage.png';

-- Show results after deletion
SELECT 'AFTER DELETION - Remaining courses:' as status;
SELECT 
    COUNT(*) as total_courses,
    COUNT(CASE WHEN course_image_url != '/logos/golfcoursedefaultimage.png' THEN 1 END) as courses_with_custom_logos,
    COUNT(CASE WHEN course_image_url = '/logos/golfcoursedefaultimage.png' THEN 1 END) as courses_with_default_logos
FROM golf_courses;

-- Show remaining courses
SELECT 'REMAINING COURSES (with custom logos):' as status;
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
ORDER BY name;

-- Success message
SELECT 'Successfully deleted courses without custom logos! Remaining courses with custom logos: ' || 
       COUNT(*) as message
FROM golf_courses;
