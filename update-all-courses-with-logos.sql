-- Update All Golf Courses with Logo URLs
-- This script updates all courses in your system with proper logo paths
-- Run this in your Supabase SQL Editor after downloading logos

-- Tennessee Golf Courses
UPDATE golf_courses SET 
    logo_url = '/logos/the_honors_course_text_logo.png',
    course_image_url = '/logos/the_honors_course_text_logo.png'
WHERE name = 'The Honors Course';

UPDATE golf_courses SET 
    logo_url = '/logos/sweetens_cove_golf_club_text_logo.png',
    course_image_url = '/logos/sweetens_cove_golf_club_text_logo.png'
WHERE name = 'Sweetens Cove Golf Club';

UPDATE golf_courses SET 
    logo_url = '/logos/the_golf_club_of_tennessee_text_logo.png',
    course_image_url = '/logos/the_golf_club_of_tennessee_text_logo.png'
WHERE name = 'The Golf Club of Tennessee';

UPDATE golf_courses SET 
    logo_url = '/logos/hermitage_golf_course_text_logo.png',
    course_image_url = '/logos/hermitage_golf_course_text_logo.png'
WHERE name = 'Hermitage Golf Course';

UPDATE golf_courses SET 
    logo_url = '/logos/gaylord_springs_golf_links_text_logo.png',
    course_image_url = '/logos/gaylord_springs_golf_links_text_logo.png'
WHERE name = 'Gaylord Springs Golf Links';

UPDATE golf_courses SET 
    logo_url = '/logos/the_grove_text_logo.png',
    course_image_url = '/logos/the_grove_text_logo.png'
WHERE name = 'The Grove';

UPDATE golf_courses SET 
    logo_url = '/logos/bear_trace_at_harrison_bay_text_logo.png',
    course_image_url = '/logos/bear_trace_at_harrison_bay_text_logo.png'
WHERE name = 'Bear Trace at Harrison Bay';

UPDATE golf_courses SET 
    logo_url = '/logos/the_legacy_golf_course_text_logo.png',
    course_image_url = '/logos/the_legacy_golf_course_text_logo.png'
WHERE name = 'The Legacy Golf Course';

UPDATE golf_courses SET 
    logo_url = '/logos/the_club_at_fairvue_plantation_text_logo.png',
    course_image_url = '/logos/the_club_at_fairvue_plantation_text_logo.png'
WHERE name = 'The Club at Fairvue Plantation';

UPDATE golf_courses SET 
    logo_url = '/logos/the_course_at_sewanee_text_logo.png',
    course_image_url = '/logos/the_course_at_sewanee_text_logo.png'
WHERE name = 'The Course at Sewanee';

-- Georgia Golf Courses
UPDATE golf_courses SET 
    logo_url = '/logos/the_club_at_lake_arrowhead_text_logo.png',
    course_image_url = '/logos/the_club_at_lake_arrowhead_text_logo.png'
WHERE name = 'The Club at Lake Arrowhead';

UPDATE golf_courses SET 
    logo_url = '/logos/woodmont_golf_country_club_text_logo.png',
    course_image_url = '/logos/woodmont_golf_country_club_text_logo.png'
WHERE name = 'Woodmont Golf & Country Club';

UPDATE golf_courses SET 
    logo_url = '/logos/vinings_golf_club_text_logo.png',
    course_image_url = '/logos/vinings_golf_club_text_logo.png'
WHERE name = 'Vinings Golf Club';

UPDATE golf_courses SET 
    logo_url = '/logos/brookstone_golf_country_club_text_logo.png',
    course_image_url = '/logos/brookstone_golf_country_club_text_logo.png'
WHERE name = 'Brookstone Golf & Country Club';

UPDATE golf_courses SET 
    logo_url = '/logos/fairways_of_canton_text_logo.png',
    course_image_url = '/logos/fairways_of_canton_text_logo.png'
WHERE name = 'Fairways of Canton';

UPDATE golf_courses SET 
    logo_url = '/logos/bridgemill_athletic_club_text_logo.png',
    course_image_url = '/logos/bridgemill_athletic_club_text_logo.png'
WHERE name = 'BridgeMill Athletic Club';

UPDATE golf_courses SET 
    logo_url = '/logos/echelon_golf_club_text_logo.png',
    course_image_url = '/logos/echelon_golf_club_text_logo.png'
WHERE name = 'Echelon Golf Club';

UPDATE golf_courses SET 
    logo_url = '/logos/woodstock_city_course_text_logo.png',
    course_image_url = '/logos/woodstock_city_course_text_logo.png'
WHERE name = 'Woodstock City Course';

UPDATE golf_courses SET 
    logo_url = '/logos/towne_lake_hills_golf_club_text_logo.png',
    course_image_url = '/logos/towne_lake_hills_golf_club_text_logo.png'
WHERE name = 'Towne Lake Hills Golf Club';

UPDATE golf_courses SET 
    logo_url = '/logos/atlanta_national_golf_club_text_logo.png',
    course_image_url = '/logos/atlanta_national_golf_club_text_logo.png'
WHERE name = 'Atlanta National Golf Club';

UPDATE golf_courses SET 
    logo_url = '/logos/white_columns_country_club_text_logo.png',
    course_image_url = '/logos/white_columns_country_club_text_logo.png'
WHERE name = 'White Columns Country Club';

UPDATE golf_courses SET 
    logo_url = '/logos/indian_hills_country_club_text_logo.png',
    course_image_url = '/logos/indian_hills_country_club_text_logo.png'
WHERE name = 'Indian Hills Country Club';

-- Famous Golf Courses
UPDATE golf_courses SET 
    logo_url = '/logos/augusta_national_golf_club_text_logo.png',
    course_image_url = '/logos/augusta_national_golf_club_text_logo.png'
WHERE name = 'Augusta National Golf Club';

UPDATE golf_courses SET 
    logo_url = '/logos/pebble_beach_golf_links_text_logo.png',
    course_image_url = '/logos/pebble_beach_golf_links_text_logo.png'
WHERE name = 'Pebble Beach Golf Links';

UPDATE golf_courses SET 
    logo_url = '/logos/mccabe_golf_course_text_logo.png',
    course_image_url = '/logos/mccabe_golf_course_text_logo.png'
WHERE name = 'McCabe Golf Course';

UPDATE golf_courses SET 
    logo_url = '/logos/torrey_pines_golf_course_text_logo.png',
    course_image_url = '/logos/torrey_pines_golf_course_text_logo.png'
WHERE name = 'Torrey Pines Golf Course';

-- Additional famous courses
UPDATE golf_courses SET 
    logo_url = '/logos/generic_golf_logo.svg',
    course_image_url = '/logos/generic_golf_logo.svg'
WHERE name = 'Bethpage Black';

UPDATE golf_courses SET 
    logo_url = '/logos/generic_golf_logo.svg',
    course_image_url = '/logos/generic_golf_logo.svg'
WHERE name = 'Chambers Bay';

UPDATE golf_courses SET 
    logo_url = '/logos/generic_golf_logo.svg',
    course_image_url = '/logos/generic_golf_logo.svg'
WHERE name = 'Streamsong Resort';

UPDATE golf_courses SET 
    logo_url = '/logos/generic_golf_logo.svg',
    course_image_url = '/logos/generic_golf_logo.svg'
WHERE name = 'Erin Hills';

UPDATE golf_courses SET 
    logo_url = '/logos/generic_golf_logo.svg',
    course_image_url = '/logos/generic_golf_logo.svg'
WHERE name = 'Royal County Down';

UPDATE golf_courses SET 
    logo_url = '/logos/generic_golf_logo.svg',
    course_image_url = '/logos/generic_golf_logo.svg'
WHERE name = 'Carnoustie Golf Links';

UPDATE golf_courses SET 
    logo_url = '/logos/generic_golf_logo.svg',
    course_image_url = '/logos/generic_golf_logo.svg'
WHERE name = 'Royal Melbourne Golf Club';

UPDATE golf_courses SET 
    logo_url = '/logos/generic_golf_logo.svg',
    course_image_url = '/logos/generic_golf_logo.svg'
WHERE name = 'Cape Kidnappers';

UPDATE golf_courses SET 
    logo_url = '/logos/generic_golf_logo.svg',
    course_image_url = '/logos/generic_golf_logo.svg'
WHERE name = 'Banff Springs Golf Course';

UPDATE golf_courses SET 
    logo_url = '/logos/generic_golf_logo.svg',
    course_image_url = '/logos/generic_golf_logo.svg'
WHERE name = 'Shinnecock Hills Golf Club';

UPDATE golf_courses SET 
    logo_url = '/logos/generic_golf_logo.svg',
    course_image_url = '/logos/generic_golf_logo.svg'
WHERE name = 'Merion Golf Club';

UPDATE golf_courses SET 
    logo_url = '/logos/generic_golf_logo.svg',
    course_image_url = '/logos/generic_golf_logo.svg'
WHERE name = 'Oakmont Country Club';

UPDATE golf_courses SET 
    logo_url = '/logos/generic_golf_logo.svg',
    course_image_url = '/logos/generic_golf_logo.svg'
WHERE name = 'Winged Foot Golf Club';

UPDATE golf_courses SET 
    logo_url = '/logos/generic_golf_logo.svg',
    course_image_url = '/logos/generic_golf_logo.svg'
WHERE name = 'Seminole Golf Club';

UPDATE golf_courses SET 
    logo_url = '/logos/generic_golf_logo.svg',
    course_image_url = '/logos/generic_golf_logo.svg'
WHERE name = 'Sand Hills Golf Club';

UPDATE golf_courses SET 
    logo_url = '/logos/generic_golf_logo.svg',
    course_image_url = '/logos/generic_golf_logo.svg'
WHERE name = 'Pacific Dunes';

UPDATE golf_courses SET 
    logo_url = '/logos/generic_golf_logo.svg',
    course_image_url = '/logos/generic_golf_logo.svg'
WHERE name = 'Bandon Trails';

UPDATE golf_courses SET 
    logo_url = '/logos/generic_golf_logo.svg',
    course_image_url = '/logos/generic_golf_logo.svg'
WHERE name = 'Old Macdonald';

UPDATE golf_courses SET 
    logo_url = '/logos/generic_golf_logo.svg',
    course_image_url = '/logos/generic_golf_logo.svg'
WHERE name = 'Bandon Preserve';

-- Fallback for any remaining courses without logos
UPDATE golf_courses SET 
    logo_url = '/logos/generic_golf_logo.svg',
    course_image_url = '/logos/generic_golf_logo.svg'
WHERE logo_url IS NULL OR logo_url = '';

-- Verify the updates
SELECT 
    name, 
    location, 
    logo_url, 
    course_image_url,
    CASE 
        WHEN logo_url LIKE '%text_logo.png%' THEN '✅ Text Logo'
        WHEN logo_url LIKE '%generic_golf_logo.svg%' THEN '✅ Generic Logo'
        WHEN logo_url IS NOT NULL AND logo_url != '' THEN '✅ Custom Logo'
        ELSE '❌ No Logo'
    END as logo_status
FROM golf_courses 
ORDER BY logo_status, name;

-- Summary of logo assignments
SELECT 
    CASE 
        WHEN logo_url LIKE '%text_logo.png%' THEN 'Text Logos'
        WHEN logo_url LIKE '%generic_golf_logo.svg%' THEN 'Generic Logos'
        WHEN logo_url IS NOT NULL AND logo_url != '' THEN 'Custom Logos'
        ELSE 'No Logo'
    END as logo_type,
    COUNT(*) as course_count
FROM golf_courses
GROUP BY logo_type
ORDER BY course_count DESC;
