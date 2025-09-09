-- Simple Course Logo Update Script
-- Replace 'your-project-id' with your actual Supabase project ID
-- Replace the logo filenames with your actual uploaded files

-- Update Canton area course logos
UPDATE golf_courses 
SET logo_url = 'https://your-project-id.supabase.co/storage/v1/object/public/course-logos/canton-golf-club-logo.png'
WHERE name = 'Canton Golf Club';

UPDATE golf_courses 
SET logo_url = 'https://your-project-id.supabase.co/storage/v1/object/public/course-logos/woodstock-golf-club-logo.png'
WHERE name = 'Woodstock Golf Club';

UPDATE golf_courses 
SET logo_url = 'https://your-project-id.supabase.co/storage/v1/object/public/course-logos/holly-springs-golf-club-logo.png'
WHERE name = 'Holly Springs Golf Club';

UPDATE golf_courses 
SET logo_url = 'https://your-project-id.supabase.co/storage/v1/object/public/course-logos/ball-ground-golf-club-logo.png'
WHERE name = 'Ball Ground Golf Club';

UPDATE golf_courses 
SET logo_url = 'https://your-project-id.supabase.co/storage/v1/object/public/course-logos/waleska-golf-club-logo.png'
WHERE name = 'Waleska Golf Club';

UPDATE golf_courses 
SET logo_url = 'https://your-project-id.supabase.co/storage/v1/object/public/course-logos/jasper-golf-club-logo.png'
WHERE name = 'Jasper Golf Club';

UPDATE golf_courses 
SET logo_url = 'https://your-project-id.supabase.co/storage/v1/object/public/course-logos/ellijay-golf-club-logo.png'
WHERE name = 'Ellijay Golf Club';

UPDATE golf_courses 
SET logo_url = 'https://your-project-id.supabase.co/storage/v1/object/public/course-logos/blue-ridge-golf-club-logo.png'
WHERE name = 'Blue Ridge Golf Club';

UPDATE golf_courses 
SET logo_url = 'https://your-project-id.supabase.co/storage/v1/object/public/course-logos/canton-municipal-golf-logo.png'
WHERE name = 'Canton Municipal Golf Course';

UPDATE golf_courses 
SET logo_url = 'https://your-project-id.supabase.co/storage/v1/object/public/course-logos/cherokee-county-golf-logo.png'
WHERE name = 'Cherokee County Golf Course';

-- Update private course logos
UPDATE golf_courses 
SET logo_url = 'https://your-project-id.supabase.co/storage/v1/object/public/course-logos/lake-arrowhead-club-logo.png'
WHERE name = 'The Club at Lake Arrowhead';

UPDATE golf_courses 
SET logo_url = 'https://your-project-id.supabase.co/storage/v1/object/public/course-logos/cherokee-golf-country-club-logo.png'
WHERE name = 'Cherokee Golf & Country Club';

-- Update Tennessee course logos
UPDATE golf_courses 
SET logo_url = 'https://your-project-id.supabase.co/storage/v1/object/public/course-logos/the-grove-logo.png'
WHERE name = 'The Grove';

UPDATE golf_courses 
SET logo_url = 'https://your-project-id.supabase.co/storage/v1/object/public/course-logos/vanderbilt-legends-club-logo.png'
WHERE name = 'Vanderbilt Legends Club';

UPDATE golf_courses 
SET logo_url = 'https://your-project-id.supabase.co/storage/v1/object/public/course-logos/belle-meade-country-club-logo.png'
WHERE name = 'Belle Meade Country Club';

UPDATE golf_courses 
SET logo_url = 'https://your-project-id.supabase.co/storage/v1/object/public/course-logos/tennessee-national-golf-club-logo.png'
WHERE name = 'Tennessee National Golf Club';

UPDATE golf_courses 
SET logo_url = 'https://your-project-id.supabase.co/storage/v1/object/public/course-logos/golden-eagle-golf-club-logo.png'
WHERE name = 'Golden Eagle Golf Club';

UPDATE golf_courses 
SET logo_url = 'https://your-project-id.supabase.co/storage/v1/object/public/course-logos/lambert-acres-golf-logo.png'
WHERE name = 'Lambert Acres Golf Course';

UPDATE golf_courses 
SET logo_url = 'https://your-project-id.supabase.co/storage/v1/object/public/course-logos/ridge-at-chickasaw-logo.png'
WHERE name = 'The Ridge at Chickasaw';

UPDATE golf_courses 
SET logo_url = 'https://your-project-id.supabase.co/storage/v1/object/public/course-logos/governors-crossing-logo.png'
WHERE name = 'The Club at Governor''s Crossing';

UPDATE golf_courses 
SET logo_url = 'https://your-project-id.supabase.co/storage/v1/object/public/course-logos/links-at-kahite-logo.png'
WHERE name = 'The Links at Kahite';

-- Check which courses now have logos
SELECT 
    name,
    location,
    CASE 
        WHEN logo_url LIKE '%supabase.co%' THEN '✅ Supabase Logo'
        WHEN logo_url LIKE '%unsplash.com%' THEN '⚠️ Generic Image'
        WHEN logo_url IS NULL OR logo_url = '' THEN '❌ No Logo'
        ELSE '❓ Other'
    END as logo_status
FROM golf_courses 
ORDER BY logo_status, name;

