-- Comprehensive Golf Course Logo Update Script
-- This script updates golf courses with their corresponding logos
-- Run this in your Supabase SQL Editor

-- First, let's see what courses we have
SELECT id, name, location, logo_url 
FROM golf_courses 
ORDER BY name;

-- Update Augusta National Golf Club (multiple variations)
UPDATE golf_courses 
SET logo_url = '/logos/augustanational.png'
WHERE LOWER(name) LIKE '%augusta%national%' 
   OR LOWER(name) LIKE '%augusta national%'
   OR LOWER(name) LIKE '%augusta%';

-- Update Pebble Beach Golf Links (multiple variations)
UPDATE golf_courses 
SET logo_url = '/logos/Pebblebeach.png'
WHERE LOWER(name) LIKE '%pebble%beach%' 
   OR LOWER(name) LIKE '%pebble beach%'
   OR LOWER(name) LIKE '%pebble%';

-- Update Woodmont Golf and Country Club
UPDATE golf_courses 
SET logo_url = '/logos/woodmont.png'
WHERE LOWER(name) LIKE '%woodmont%' 
   OR LOWER(name) LIKE '%woodmont golf%'
   OR LOWER(name) LIKE '%woodmont country%';

-- Update The Club at Lake Arrowhead
UPDATE golf_courses 
SET logo_url = '/logos/arrowhead.png'
WHERE LOWER(name) LIKE '%arrowhead%' 
   OR LOWER(name) LIKE '%lake arrowhead%'
   OR LOWER(name) LIKE '%club at lake%';

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
   OR LOWER(name) LIKE '%bandon dunes%'
   OR LOWER(name) LIKE '%bandon resort%';

-- Update Bethpage State Park Golf Course
UPDATE golf_courses 
SET logo_url = '/logos/bethpagelogo.png'
WHERE LOWER(name) LIKE '%bethpage%' 
   OR LOWER(name) LIKE '%bethpage state%'
   OR LOWER(name) LIKE '%bethpage park%';

-- Update Carnoustie Golf Links
UPDATE golf_courses 
SET logo_url = '/logos/carnoustielogo.png'
WHERE LOWER(name) LIKE '%carnoustie%' 
   OR LOWER(name) LIKE '%carnoustie golf%'
   OR LOWER(name) LIKE '%carnoustie links%';

-- Update Chambers Bay Golf Course
UPDATE golf_courses 
SET logo_url = '/logos/chambersbay.svg'
WHERE LOWER(name) LIKE '%chambers%bay%' 
   OR LOWER(name) LIKE '%chambers bay%'
   OR LOWER(name) LIKE '%chambers%';

-- Update Streamsong Resort
UPDATE golf_courses 
SET logo_url = '/logos/streamsonglogo.png'
WHERE LOWER(name) LIKE '%streamsong%' 
   OR LOWER(name) LIKE '%streamsong resort%'
   OR LOWER(name) LIKE '%streamsong golf%';

-- Update Ted Rhodes Golf Course
UPDATE golf_courses 
SET logo_url = '/logos/TedRhodeslogo.jpg'
WHERE LOWER(name) LIKE '%ted%rhodes%' 
   OR LOWER(name) LIKE '%ted rhodes%'
   OR LOWER(name) LIKE '%rhodes%';

-- Update Torrey Pines Golf Course (if exists)
UPDATE golf_courses 
SET logo_url = '/logos/torrey_pines_golf_course_text_logo.png'
WHERE LOWER(name) LIKE '%torrey%pines%' 
   OR LOWER(name) LIKE '%torrey pines%';

-- Update Gaylord Springs Golf Links (if exists)
UPDATE golf_courses 
SET logo_url = '/logos/gaylord_springs_golf_links_text_logo.png'
WHERE LOWER(name) LIKE '%gaylord%springs%' 
   OR LOWER(name) LIKE '%gaylord springs%';

-- Update The Honors Course (if exists)
UPDATE golf_courses 
SET logo_url = '/logos/the_honors_course_text_logo.png'
WHERE LOWER(name) LIKE '%honors%course%' 
   OR LOWER(name) LIKE '%honors course%';

-- Set default logo for courses without specific logos
UPDATE golf_courses 
SET logo_url = '/logos/golfcoursedefaultimage.png'
WHERE logo_url IS NULL 
   OR logo_url = ''
   OR logo_url NOT LIKE '/logos/%';

-- Show final results
SELECT 
    name,
    location,
    logo_url,
    CASE 
        WHEN logo_url LIKE '/logos/%' AND logo_url != '/logos/golfcoursedefaultimage.png' THEN '✅ Custom Logo'
        WHEN logo_url = '/logos/golfcoursedefaultimage.png' THEN '🔄 Default Logo'
        ELSE '❌ No Logo'
    END as logo_status
FROM golf_courses 
ORDER BY 
    CASE 
        WHEN logo_url LIKE '/logos/%' AND logo_url != '/logos/golfcoursedefaultimage.png' THEN 1
        WHEN logo_url = '/logos/golfcoursedefaultimage.png' THEN 2
        ELSE 3
    END,
    name;

-- Summary statistics
SELECT 
    COUNT(*) as total_courses,
    COUNT(CASE WHEN logo_url LIKE '/logos/%' AND logo_url != '/logos/golfcoursedefaultimage.png' THEN 1 END) as courses_with_custom_logos,
    COUNT(CASE WHEN logo_url = '/logos/golfcoursedefaultimage.png' THEN 1 END) as courses_with_default_logo,
    COUNT(CASE WHEN logo_url IS NULL OR logo_url = '' OR logo_url NOT LIKE '/logos/%' THEN 1 END) as courses_without_logos
FROM golf_courses;
