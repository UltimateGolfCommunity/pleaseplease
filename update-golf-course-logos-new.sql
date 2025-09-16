-- Update Golf Course Logos with New Uploaded Logos
-- Run this script in your Supabase SQL Editor

-- Update Augusta National Golf Club
UPDATE golf_courses 
SET logo_url = '/logos/augustanational.png'
WHERE LOWER(name) LIKE '%augusta%national%' 
   OR LOWER(name) LIKE '%augusta national%';

-- Update Pebble Beach Golf Links
UPDATE golf_courses 
SET logo_url = '/logos/Pebblebeach.png'
WHERE LOWER(name) LIKE '%pebble%beach%' 
   OR LOWER(name) LIKE '%pebble beach%';

-- Update Woodmont Golf and Country Club
UPDATE golf_courses 
SET logo_url = '/logos/woodmont.png'
WHERE LOWER(name) LIKE '%woodmont%' 
   OR LOWER(name) LIKE '%woodmont golf%';

-- Update The Club at Lake Arrowhead
UPDATE golf_courses 
SET logo_url = '/logos/arrowhead.png'
WHERE LOWER(name) LIKE '%arrowhead%' 
   OR LOWER(name) LIKE '%lake arrowhead%';

-- Update Hermitage Golf Course
UPDATE golf_courses 
SET logo_url = '/logos/hermitagegolfcourse.jpeg'
WHERE LOWER(name) LIKE '%hermitage%' 
   OR LOWER(name) LIKE '%hermitage golf%';

-- Update McCabe Golf Course
UPDATE golf_courses 
SET logo_url = '/logos/Mccabe.png'
WHERE LOWER(name) LIKE '%mccabe%' 
   OR LOWER(name) LIKE '%mccabe golf%';

-- Update Bandon Dunes Golf Resort
UPDATE golf_courses 
SET logo_url = '/logos/bandonlogo.jpeg'
WHERE LOWER(name) LIKE '%bandon%' 
   OR LOWER(name) LIKE '%bandon dunes%';

-- Update Bethpage State Park Golf Course
UPDATE golf_courses 
SET logo_url = '/logos/bethpagelogo.png'
WHERE LOWER(name) LIKE '%bethpage%' 
   OR LOWER(name) LIKE '%bethpage state%';

-- Update Carnoustie Golf Links
UPDATE golf_courses 
SET logo_url = '/logos/carnoustielogo.png'
WHERE LOWER(name) LIKE '%carnoustie%' 
   OR LOWER(name) LIKE '%carnoustie golf%';

-- Update Chambers Bay Golf Course
UPDATE golf_courses 
SET logo_url = '/logos/chambersbay.svg'
WHERE LOWER(name) LIKE '%chambers%bay%' 
   OR LOWER(name) LIKE '%chambers bay%';

-- Update Streamsong Resort
UPDATE golf_courses 
SET logo_url = '/logos/streamsonglogo.png'
WHERE LOWER(name) LIKE '%streamsong%' 
   OR LOWER(name) LIKE '%streamsong resort%';

-- Update Ted Rhodes Golf Course
UPDATE golf_courses 
SET logo_url = '/logos/TedRhodeslogo.jpg'
WHERE LOWER(name) LIKE '%ted%rhodes%' 
   OR LOWER(name) LIKE '%ted rhodes%';

-- Update courses that might have generic names with the default logo
UPDATE golf_courses 
SET logo_url = '/logos/golfcoursedefaultimage.png'
WHERE logo_url IS NULL 
   OR logo_url = '';

-- Show updated courses with their new logos
SELECT 
    name,
    location,
    logo_url,
    CASE 
        WHEN logo_url IS NOT NULL AND logo_url != '' THEN '✅ Has Logo'
        ELSE '❌ No Logo'
    END as logo_status
FROM golf_courses 
ORDER BY name;

-- Count courses with and without logos
SELECT 
    COUNT(*) as total_courses,
    COUNT(CASE WHEN logo_url IS NOT NULL AND logo_url != '' THEN 1 END) as courses_with_logos,
    COUNT(CASE WHEN logo_url IS NULL OR logo_url = '' THEN 1 END) as courses_without_logos
FROM golf_courses;
