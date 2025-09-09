-- Get all golf courses from the database
-- Run this in Supabase SQL Editor to see all courses

SELECT 
    id,
    name,
    location,
    description,
    par,
    holes,
    course_type,
    green_fees_min,
    green_fees_max,
    latitude,
    longitude,
    logo_url,
    course_image_url,
    created_at,
    updated_at
FROM golf_courses 
ORDER BY name;

-- Alternative query with review stats
SELECT 
    gc.id,
    gc.name,
    gc.location,
    gc.description,
    gc.par,
    gc.holes,
    gc.course_type,
    gc.green_fees_min,
    gc.green_fees_max,
    gc.latitude,
    gc.longitude,
    gc.logo_url,
    gc.course_image_url,
    COALESCE(AVG(cr.rating), 0) as average_rating,
    COUNT(cr.id) as review_count,
    gc.created_at,
    gc.updated_at
FROM golf_courses gc
LEFT JOIN course_reviews cr ON gc.id = cr.course_id
GROUP BY gc.id, gc.name, gc.location, gc.description, gc.par, gc.holes, 
         gc.course_type, gc.green_fees_min, gc.green_fees_max, 
         gc.latitude, gc.longitude, gc.logo_url, gc.course_image_url, 
         gc.created_at, gc.updated_at
ORDER BY gc.name;
