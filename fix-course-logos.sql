-- Fix Course Logos with Working Image URLs
-- This script updates existing courses with better, working image URLs
-- Run this in your Supabase SQL Editor

-- Update Tennessee courses with better image URLs
UPDATE golf_courses 
SET 
    course_image_url = 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=1200&h=800&fit=crop&crop=center&auto=format&q=80',
    logo_url = 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop&crop=center&auto=format&q=80'
WHERE name = 'The Honors Course' AND state = 'TN';

UPDATE golf_courses 
SET 
    course_image_url = 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=1200&h=800&fit=crop&crop=center&auto=format&q=80',
    logo_url = 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=200&h=200&fit=crop&crop=center&auto=format&q=80'
WHERE name = 'Sweetens Cove Golf Club' AND state = 'TN';

UPDATE golf_courses 
SET 
    course_image_url = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&h=800&fit=crop&crop=center&auto=format&q=80',
    logo_url = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop&crop=center&auto=format&q=80'
WHERE name = 'The Golf Club of Tennessee' AND state = 'TN';

UPDATE golf_courses 
SET 
    course_image_url = 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=1200&h=800&fit=crop&crop=center&auto=format&q=80',
    logo_url = 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=200&h=200&fit=crop&crop=center&auto=format&q=80'
WHERE name = 'Hermitage Golf Course' AND state = 'TN';

UPDATE golf_courses 
SET 
    course_image_url = 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=800&fit=crop&crop=center&auto=format&q=80',
    logo_url = 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=200&fit=crop&crop=center&auto=format&q=80'
WHERE name = 'Gaylord Springs Golf Links' AND state = 'TN';

UPDATE golf_courses 
SET 
    course_image_url = 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=1200&h=800&fit=crop&crop=center&auto=format&q=80',
    logo_url = 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=200&h=200&fit=crop&crop=center&auto=format&q=80'
WHERE name = 'The Grove' AND state = 'TN';

-- Update Nashville courses with better image URLs
UPDATE golf_courses 
SET 
    course_image_url = 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=1200&h=800&fit=crop&crop=center&auto=format&q=80',
    logo_url = 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop&crop=center&auto=format&q=80'
WHERE name = 'Belle Meade Country Club' AND city = 'Nashville';

UPDATE golf_courses 
SET 
    course_image_url = 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=1200&h=800&fit=crop&crop=center&auto=format&q=80',
    logo_url = 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=200&h=200&fit=crop&crop=center&auto=format&q=80'
WHERE name = 'Richland Country Club' AND city = 'Nashville';

UPDATE golf_courses 
SET 
    course_image_url = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&h=800&fit=crop&crop=center&auto=format&q=80',
    logo_url = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop&crop=center&auto=format&q=80'
WHERE name = 'Nashville Golf & Athletic Club' AND city = 'Nashville';

UPDATE golf_courses 
SET 
    course_image_url = 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=1200&h=800&fit=crop&crop=center&auto=format&q=80',
    logo_url = 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=200&h=200&fit=crop&crop=center&auto=format&q=80'
WHERE name = 'Harpeth Hills Golf Course' AND city = 'Nashville';

UPDATE golf_courses 
SET 
    course_image_url = 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=800&fit=crop&crop=center&auto=format&q=80',
    logo_url = 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=200&fit=crop&crop=center&auto=format&q=80'
WHERE name = 'Two Rivers Golf Course' AND city = 'Nashville';

UPDATE golf_courses 
SET 
    course_image_url = 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=1200&h=800&fit=crop&crop=center&auto=format&q=80',
    logo_url = 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=200&h=200&fit=crop&crop=center&auto=format&q=80'
WHERE name = 'Ted Rhodes Golf Course' AND city = 'Nashville';

UPDATE golf_courses 
SET 
    course_image_url = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&h=800&fit=crop&crop=center&auto=format&q=80',
    logo_url = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop&crop=center&auto=format&q=80'
WHERE name = 'McCabe Golf Course' AND city = 'Nashville';

UPDATE golf_courses 
SET 
    course_image_url = 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=1200&h=800&fit=crop&crop=center&auto=format&q=80',
    logo_url = 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=200&h=200&fit=crop&crop=center&auto=format&q=80'
WHERE name = 'Shelby Golf Course' AND city = 'Nashville';

UPDATE golf_courses 
SET 
    course_image_url = 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=800&fit=crop&crop=center&auto=format&q=80',
    logo_url = 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=200&fit=crop&crop=center&auto=format&q=80'
WHERE name = 'The Golf Club at Tennessee' AND city = 'Nashville';

UPDATE golf_courses 
SET 
    course_image_url = 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=1200&h=800&fit=crop&crop=center&auto=format&q=80',
    logo_url = 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=200&h=200&fit=crop&crop=center&auto=format&q=80'
WHERE name = 'VinnyLinks Golf Course' AND city = 'Nashville';

-- Verify the updates
SELECT 
    name,
    city,
    course_image_url,
    logo_url
FROM golf_courses 
WHERE (state = 'TN' OR city = 'Nashville')
ORDER BY name;

-- Show summary
SELECT 
    'Course logos updated successfully' AS status,
    COUNT(*) AS total_courses,
    COUNT(CASE WHEN course_image_url IS NOT NULL THEN 1 END) AS courses_with_images,
    COUNT(CASE WHEN logo_url IS NOT NULL THEN 1 END) AS courses_with_logos
FROM golf_courses 
WHERE (state = 'TN' OR city = 'Nashville');
