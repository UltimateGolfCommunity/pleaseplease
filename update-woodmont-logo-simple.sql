-- Update Woodmont Golf & Country Club with Local Logo
-- Run this in your Supabase SQL Editor after uploading the logo

-- Update Woodmont Golf & Country Club with local logo path
UPDATE golf_courses SET 
    logo_url = '/logos/woodmont.png',
    course_image_url = '/logos/woodmont.png'
WHERE name = 'Woodmont Golf & Country Club';

-- Verify the update
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
WHERE name = 'Woodmont Golf & Country Club';

-- Show all courses that need logos
SELECT 
    name, 
    location, 
    logo_url,
    CASE 
        WHEN logo_url IS NULL OR logo_url = '' OR logo_url LIKE '%unsplash%' THEN '❌ Needs Logo'
        ELSE '✅ Has Logo'
    END as logo_status
FROM golf_courses 
ORDER BY logo_status DESC, name;
