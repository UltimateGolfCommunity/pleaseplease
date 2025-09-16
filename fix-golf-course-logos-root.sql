-- Fix Golf Course Logos - Use Root Public Directory Paths
-- Run this script in your Supabase SQL Editor

-- Update Augusta National Golf Club
UPDATE golf_courses 
SET logo_url = '/augustanational.png'
WHERE LOWER(name) LIKE '%augusta%national%' 
   OR LOWER(name) LIKE '%augusta national%'
   OR LOWER(name) LIKE '%augusta%';

-- Update Pebble Beach Golf Links
UPDATE golf_courses 
SET logo_url = '/Pebblebeach.png'
WHERE LOWER(name) LIKE '%pebble%beach%' 
   OR LOWER(name) LIKE '%pebble beach%'
   OR LOWER(name) LIKE '%pebble%';

-- Update Woodmont Golf and Country Club
UPDATE golf_courses 
SET logo_url = '/woodmont.png'
WHERE LOWER(name) LIKE '%woodmont%' 
   OR LOWER(name) LIKE '%woodmont golf%'
   OR LOWER(name) LIKE '%woodmont country%';

-- Update The Club at Lake Arrowhead
UPDATE golf_courses 
SET logo_url = '/arrowhead.png'
WHERE LOWER(name) LIKE '%arrowhead%' 
   OR LOWER(name) LIKE '%lake arrowhead%'
   OR LOWER(name) LIKE '%club at lake%';

-- Update Hermitage Golf Course
UPDATE golf_courses 
SET logo_url = '/hermitagegolfcourse.jpeg'
WHERE LOWER(name) LIKE '%hermitage%' 
   OR LOWER(name) LIKE '%hermitage golf%';

-- Update McCabe Golf Course
UPDATE golf_courses 
SET logo_url = '/Mccabe.png'
WHERE LOWER(name) LIKE '%mccabe%' 
   OR LOWER(name) LIKE '%mccabe golf%';

-- Update Bandon Dunes Golf Resort
UPDATE golf_courses 
SET logo_url = '/bandonlogo.jpeg'
WHERE LOWER(name) LIKE '%bandon%' 
   OR LOWER(name) LIKE '%bandon dunes%'
   OR LOWER(name) LIKE '%bandon resort%';

-- Update Bethpage State Park Golf Course
UPDATE golf_courses 
SET logo_url = '/bethpagelogo.png'
WHERE LOWER(name) LIKE '%bethpage%' 
   OR LOWER(name) LIKE '%bethpage state%'
   OR LOWER(name) LIKE '%bethpage park%';

-- Update Carnoustie Golf Links
UPDATE golf_courses 
SET logo_url = '/carnoustielogo.png'
WHERE LOWER(name) LIKE '%carnoustie%' 
   OR LOWER(name) LIKE '%carnoustie golf%'
   OR LOWER(name) LIKE '%carnoustie links%';

-- Update Chambers Bay Golf Course
UPDATE golf_courses 
SET logo_url = '/chambersbay.svg'
WHERE LOWER(name) LIKE '%chambers%bay%' 
   OR LOWER(name) LIKE '%chambers bay%'
   OR LOWER(name) LIKE '%chambers%';

-- Update Streamsong Resort
UPDATE golf_courses 
SET logo_url = '/streamsonglogo.png'
WHERE LOWER(name) LIKE '%streamsong%' 
   OR LOWER(name) LIKE '%streamsong resort%'
   OR LOWER(name) LIKE '%streamsong golf%';

-- Update Ted Rhodes Golf Course
UPDATE golf_courses 
SET logo_url = '/TedRhodeslogo.jpg'
WHERE LOWER(name) LIKE '%ted%rhodes%' 
   OR LOWER(name) LIKE '%ted rhodes%'
   OR LOWER(name) LIKE '%rhodes%';

-- Set default logo for courses without specific logos
UPDATE golf_courses 
SET logo_url = '/golfcoursedefaultimage.png'
WHERE logo_url IS NULL 
   OR logo_url = ''
   OR logo_url LIKE '/logos/%';

-- Show final results
SELECT 
    name,
    location,
    logo_url,
    CASE 
        WHEN logo_url LIKE '/%.png' OR logo_url LIKE '/%.jpg' OR logo_url LIKE '/%.jpeg' OR logo_url LIKE '/%.svg' THEN '✅ Has Logo'
        ELSE '❌ No Logo'
    END as logo_status
FROM golf_courses 
ORDER BY 
    CASE 
        WHEN logo_url LIKE '/%.png' OR logo_url LIKE '/%.jpg' OR logo_url LIKE '/%.jpeg' OR logo_url LIKE '/%.svg' THEN 1
        ELSE 2
    END,
    name;

-- Summary statistics
SELECT 
    COUNT(*) as total_courses,
    COUNT(CASE WHEN logo_url LIKE '/%.png' OR logo_url LIKE '/%.jpg' OR logo_url LIKE '/%.jpeg' OR logo_url LIKE '/%.svg' THEN 1 END) as courses_with_logos,
    COUNT(CASE WHEN logo_url IS NULL OR logo_url = '' OR logo_url NOT LIKE '/%.png' AND logo_url NOT LIKE '/%.jpg' AND logo_url NOT LIKE '/%.jpeg' AND logo_url NOT LIKE '/%.svg' THEN 1 END) as courses_without_logos
FROM golf_courses;
