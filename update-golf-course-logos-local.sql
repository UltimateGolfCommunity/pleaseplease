-- Update Golf Course Logos with Local File Paths
-- This script updates all golf courses with local logo paths
-- Run this in your Supabase SQL Editor

-- Update Tennessee Golf Courses with Local Logo Paths
UPDATE golf_courses SET 
    logo_url = '/logos/honors-course-logo.png',
    course_image_url = '/logos/honors-course-image.jpg'
WHERE name = 'The Honors Course';

UPDATE golf_courses SET 
    logo_url = '/logos/belle-meade-logo.png',
    course_image_url = '/logos/belle-meade-image.jpg'
WHERE name = 'Belle Meade Country Club';

UPDATE golf_courses SET 
    logo_url = '/logos/gaylord-springs-logo.png',
    course_image_url = '/logos/gaylord-springs-image.jpg'
WHERE name = 'Gaylord Springs Golf Links';

UPDATE golf_courses SET 
    logo_url = '/logos/hermitage-logo.png',
    course_image_url = '/logos/hermitage-image.jpg'
WHERE name = 'The Hermitage Golf Course';

UPDATE golf_courses SET 
    logo_url = '/logos/richland-logo.png',
    course_image_url = '/logos/richland-image.jpg'
WHERE name = 'Richland Country Club';

UPDATE golf_courses SET 
    logo_url = '/logos/nashville-golf-logo.png',
    course_image_url = '/logos/nashville-golf-image.jpg'
WHERE name = 'Nashville Golf & Athletic Club';

UPDATE golf_courses SET 
    logo_url = '/logos/legacy-logo.png',
    course_image_url = '/logos/legacy-image.jpg'
WHERE name = 'The Legacy Golf Course';

UPDATE golf_courses SET 
    logo_url = '/logos/harpeth-hills-logo.png',
    course_image_url = '/logos/harpeth-hills-image.jpg'
WHERE name = 'Harpeth Hills Golf Course';

UPDATE golf_courses SET 
    logo_url = '/logos/vanderbilt-legends-logo.png',
    course_image_url = '/logos/vanderbilt-legends-image.jpg'
WHERE name = 'Vanderbilt Legends Club';

UPDATE golf_courses SET 
    logo_url = '/logos/grove-williamson-logo.png',
    course_image_url = '/logos/grove-williamson-image.jpg'
WHERE name = 'The Grove at Williamson County';

-- Update Canton, Georgia Area Golf Courses with Local Logo Paths
UPDATE golf_courses SET 
    logo_url = '/logos/woodmont-logo.png',
    course_image_url = '/logos/woodmont-image.jpg'
WHERE name = 'Woodmont Golf & Country Club';

UPDATE golf_courses SET 
    logo_url = '/logos/canton-golf-logo.png',
    course_image_url = '/logos/canton-golf-image.jpg'
WHERE name = 'Canton Golf Club';

UPDATE golf_courses SET 
    logo_url = '/logos/cherokee-golf-logo.png',
    course_image_url = '/logos/cherokee-golf-image.jpg'
WHERE name = 'Cherokee Golf & Country Club';

UPDATE golf_courses SET 
    logo_url = '/logos/cobblestone-logo.png',
    course_image_url = '/logos/cobblestone-image.jpg'
WHERE name = 'Cobblestone Golf Course';

UPDATE golf_courses SET 
    logo_url = '/logos/manor-golf-logo.png',
    course_image_url = '/logos/manor-golf-image.jpg'
WHERE name = 'The Manor Golf & Country Club';

UPDATE golf_courses SET 
    logo_url = '/logos/riverpointe-logo.png',
    course_image_url = '/logos/riverpointe-image.jpg'
WHERE name = 'RiverPointe Golf Club';

UPDATE golf_courses SET 
    logo_url = '/logos/canton-course-logo.png',
    course_image_url = '/logos/canton-course-image.jpg'
WHERE name = 'Canton Golf Course';

UPDATE golf_courses SET 
    logo_url = '/logos/farm-golf-logo.png',
    course_image_url = '/logos/farm-golf-image.jpg'
WHERE name = 'The Farm Golf Club';

UPDATE golf_courses SET 
    logo_url = '/logos/cherokee-run-logo.png',
    course_image_url = '/logos/cherokee-run-image.jpg'
WHERE name = 'Cherokee Run Golf Club';

-- Update any remaining courses with default golf logos
UPDATE golf_courses SET 
    logo_url = '/logos/default-golf-logo.png',
    course_image_url = '/logos/default-golf-image.jpg'
WHERE logo_url IS NULL OR logo_url = '';

-- Verify the updates
SELECT 
    name, 
    location, 
    logo_url, 
    course_image_url,
    CASE 
        WHEN logo_url IS NOT NULL AND logo_url != '' THEN '✅ Logo Updated'
        ELSE '❌ No Logo'
    END as logo_status
FROM golf_courses 
ORDER BY name;

-- Show summary
SELECT 
    COUNT(*) as total_courses,
    COUNT(CASE WHEN logo_url IS NOT NULL AND logo_url != '' THEN 1 END) as courses_with_logos,
    COUNT(CASE WHEN course_image_url IS NOT NULL AND course_image_url != '' THEN 1 END) as courses_with_images
FROM golf_courses;
