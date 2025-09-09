-- Fix Logo URLs to use relative paths instead of absolute URLs
-- This fixes the 404 errors for logos

-- Update all courses to use relative logo paths
UPDATE golf_courses SET 
    logo_url = '/logos/woodmont.png',
    course_image_url = '/logos/woodmont.png'
WHERE logo_url LIKE '%ultimategolfcommunity.com%' OR logo_url LIKE '%www.%';

-- Update specific courses with their correct logos
UPDATE golf_courses SET 
    logo_url = '/logos/woodmont.png',
    course_image_url = '/logos/woodmont.png'
WHERE name = 'Woodmont Golf & Country Club';

UPDATE golf_courses SET 
    logo_url = '/logos/arrowhead.png',
    course_image_url = '/logos/arrowhead.png'
WHERE name LIKE '%Lake Arrowhead%' OR name LIKE '%Arrowhead%';

UPDATE golf_courses SET 
    logo_url = '/logos/augustanational.png',
    course_image_url = '/logos/augustanational.png'
WHERE name = 'Augusta National Golf Club';

UPDATE golf_courses SET 
    logo_url = '/logos/Pebblebeach.png',
    course_image_url = '/logos/Pebblebeach.png'
WHERE name = 'Pebble Beach Golf Links';

UPDATE golf_courses SET 
    logo_url = '/logos/Mccabe.png',
    course_image_url = '/logos/Mccabe.png'
WHERE name = 'McCabe Golf Course';

-- Verify the updates
SELECT 
    name, 
    logo_url, 
    course_image_url,
    CASE 
        WHEN logo_url LIKE '/logos/%' THEN '✅ Fixed'
        WHEN logo_url LIKE '%ultimategolfcommunity.com%' THEN '❌ Still broken'
        ELSE '⚠️ Other'
    END as status
FROM golf_courses 
ORDER BY status, name;
