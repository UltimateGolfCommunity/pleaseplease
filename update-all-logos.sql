-- Update All Golf Course Logos with Local Files
-- This script updates all golf courses with their local logo files
-- Run this in your Supabase SQL Editor

-- Update Woodmont Golf & Country Club
UPDATE golf_courses SET 
    logo_url = '/logos/woodmont.png',
    course_image_url = '/logos/woodmont.png'
WHERE name = 'Woodmont Golf & Country Club';

-- Update ALL Lake Arrowhead clubs (using arrowhead.png)
UPDATE golf_courses SET 
    logo_url = '/logos/arrowhead.png',
    course_image_url = '/logos/arrowhead.png'
WHERE name LIKE '%Lake Arrowhead%' OR name LIKE '%Arrowhead%';

-- Update Augusta National (if you have it in your database)
UPDATE golf_courses SET 
    logo_url = '/logos/augustanational.png',
    course_image_url = '/logos/augustanational.png'
WHERE name = 'Augusta National Golf Club';

-- Update Pebble Beach (if you have it in your database)
UPDATE golf_courses SET 
    logo_url = '/logos/Pebblebeach.png',
    course_image_url = '/logos/Pebblebeach.png'
WHERE name = 'Pebble Beach Golf Links';

-- Update McCabe Golf Course (if you have it in your database)
UPDATE golf_courses SET 
    logo_url = '/logos/Mccabe.png',
    course_image_url = '/logos/Mccabe.png'
WHERE name = 'McCabe Golf Course';

-- Update any remaining courses with default golf logos
UPDATE golf_courses SET 
    logo_url = '/logos/woodmont.png',
    course_image_url = '/logos/woodmont.png'
WHERE logo_url IS NULL OR logo_url = '' OR logo_url LIKE '%unsplash%';

-- Verify all updates
SELECT 
    name, 
    location, 
    logo_url, 
    course_image_url,
    CASE 
        WHEN logo_url IS NOT NULL AND logo_url != '' AND logo_url NOT LIKE '%unsplash%' THEN '✅ Real Logo'
        WHEN logo_url LIKE '%unsplash%' THEN '🔄 Generic Image'
        ELSE '❌ No Logo'
    END as logo_status
FROM golf_courses 
ORDER BY logo_status DESC, name;

-- Show summary
SELECT 
    COUNT(*) as total_courses,
    COUNT(CASE WHEN logo_url IS NOT NULL AND logo_url != '' AND logo_url NOT LIKE '%unsplash%' THEN 1 END) as courses_with_real_logos,
    COUNT(CASE WHEN logo_url LIKE '%unsplash%' THEN 1 END) as courses_with_generic_images,
    COUNT(CASE WHEN logo_url IS NULL OR logo_url = '' THEN 1 END) as courses_without_logos
FROM golf_courses;
