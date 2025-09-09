-- Complete Golf Course Logo Update Script
-- This script updates all golf courses with their local logo files
-- Run this in your Supabase SQL Editor

-- ===========================================
-- UPDATE EXISTING COURSES WITH REAL LOGOS
-- ===========================================

-- 1. Woodmont Golf & Country Club
UPDATE golf_courses SET 
    logo_url = '/logos/woodmont.png',
    course_image_url = '/logos/woodmont.png'
WHERE name = 'Woodmont Golf & Country Club';

-- 2. ALL Lake Arrowhead clubs (using arrowhead.png)
UPDATE golf_courses SET 
    logo_url = '/logos/arrowhead.png',
    course_image_url = '/logos/arrowhead.png'
WHERE name LIKE '%Lake Arrowhead%' OR name LIKE '%Arrowhead%';

-- 3. Augusta National Golf Club
UPDATE golf_courses SET 
    logo_url = '/logos/augustanational.png',
    course_image_url = '/logos/augustanational.png'
WHERE name = 'Augusta National Golf Club';

-- 4. Pebble Beach Golf Links
UPDATE golf_courses SET 
    logo_url = '/logos/Pebblebeach.png',
    course_image_url = '/logos/Pebblebeach.png'
WHERE name = 'Pebble Beach Golf Links';

-- 5. McCabe Golf Course
UPDATE golf_courses SET 
    logo_url = '/logos/Mccabe.png',
    course_image_url = '/logos/Mccabe.png'
WHERE name = 'McCabe Golf Course';

-- ===========================================
-- UPDATE TENNESSEE COURSES WITH AVAILABLE LOGOS
-- ===========================================

-- Use Woodmont logo for premium Tennessee courses
UPDATE golf_courses SET 
    logo_url = '/logos/woodmont.png',
    course_image_url = '/logos/woodmont.png'
WHERE name IN (
    'The Honors Course',
    'Belle Meade Country Club',
    'Richland Country Club'
);

-- Use Arrowhead logo for other Tennessee courses
UPDATE golf_courses SET 
    logo_url = '/logos/arrowhead.png',
    course_image_url = '/logos/arrowhead.png'
WHERE name IN (
    'Gaylord Springs Golf Links',
    'The Hermitage Golf Course',
    'Nashville Golf & Athletic Club',
    'The Legacy Golf Course',
    'Harpeth Hills Golf Course',
    'Vanderbilt Legends Club',
    'The Grove at Williamson County'
);

-- ===========================================
-- UPDATE CANTON, GEORGIA AREA COURSES
-- ===========================================

-- Use Woodmont logo for premium Canton courses
UPDATE golf_courses SET 
    logo_url = '/logos/woodmont.png',
    course_image_url = '/logos/woodmont.png'
WHERE name IN (
    'Cherokee Golf & Country Club',
    'The Manor Golf & Country Club',
    'The Farm Golf Club'
);

-- Use Arrowhead logo for other Canton courses
UPDATE golf_courses SET 
    logo_url = '/logos/arrowhead.png',
    course_image_url = '/logos/arrowhead.png'
WHERE name IN (
    'Canton Golf Club',
    'Cobblestone Golf Course',
    'RiverPointe Golf Club',
    'Canton Golf Course',
    'Cherokee Run Golf Club'
);

-- ===========================================
-- UPDATE ANY REMAINING COURSES
-- ===========================================

-- Use Woodmont logo as default for any remaining courses
UPDATE golf_courses SET 
    logo_url = '/logos/woodmont.png',
    course_image_url = '/logos/woodmont.png'
WHERE logo_url IS NULL OR logo_url = '' OR logo_url LIKE '%unsplash%';

-- ===========================================
-- VERIFICATION QUERIES
-- ===========================================

-- Show all courses with their logo status
SELECT 
    name, 
    location, 
    logo_url, 
    course_image_url,
    CASE 
        WHEN logo_url = '/logos/woodmont.png' THEN '🏌️ Woodmont Logo'
        WHEN logo_url = '/logos/arrowhead.png' THEN '🏹 Arrowhead Logo'
        WHEN logo_url = '/logos/augustanational.png' THEN '🏆 Augusta Logo'
        WHEN logo_url = '/logos/Pebblebeach.png' THEN '🏖️ Pebble Beach Logo'
        WHEN logo_url = '/logos/Mccabe.png' THEN '⛳ McCabe Logo'
        WHEN logo_url IS NOT NULL AND logo_url != '' AND logo_url NOT LIKE '%unsplash%' THEN '✅ Real Logo'
        WHEN logo_url LIKE '%unsplash%' THEN '🔄 Generic Image'
        ELSE '❌ No Logo'
    END as logo_status
FROM golf_courses 
ORDER BY logo_status DESC, name;

-- Show summary statistics
SELECT 
    COUNT(*) as total_courses,
    COUNT(CASE WHEN logo_url = '/logos/woodmont.png' THEN 1 END) as woodmont_logos,
    COUNT(CASE WHEN logo_url = '/logos/arrowhead.png' THEN 1 END) as arrowhead_logos,
    COUNT(CASE WHEN logo_url = '/logos/augustanational.png' THEN 1 END) as augusta_logos,
    COUNT(CASE WHEN logo_url = '/logos/Pebblebeach.png' THEN 1 END) as pebble_logos,
    COUNT(CASE WHEN logo_url = '/logos/Mccabe.png' THEN 1 END) as mccabe_logos,
    COUNT(CASE WHEN logo_url IS NOT NULL AND logo_url != '' AND logo_url NOT LIKE '%unsplash%' THEN 1 END) as courses_with_real_logos,
    COUNT(CASE WHEN logo_url LIKE '%unsplash%' THEN 1 END) as courses_with_generic_images,
    COUNT(CASE WHEN logo_url IS NULL OR logo_url = '' THEN 1 END) as courses_without_logos
FROM golf_courses;

-- Show courses by logo type
SELECT 
    CASE 
        WHEN logo_url = '/logos/woodmont.png' THEN 'Woodmont Logo'
        WHEN logo_url = '/logos/arrowhead.png' THEN 'Arrowhead Logo'
        WHEN logo_url = '/logos/augustanational.png' THEN 'Augusta Logo'
        WHEN logo_url = '/logos/Pebblebeach.png' THEN 'Pebble Beach Logo'
        WHEN logo_url = '/logos/Mccabe.png' THEN 'McCabe Logo'
        ELSE 'Other'
    END as logo_type,
    COUNT(*) as course_count,
    STRING_AGG(name, ', ' ORDER BY name) as course_names
FROM golf_courses 
WHERE logo_url IS NOT NULL AND logo_url != ''
GROUP BY 
    CASE 
        WHEN logo_url = '/logos/woodmont.png' THEN 'Woodmont Logo'
        WHEN logo_url = '/logos/arrowhead.png' THEN 'Arrowhead Logo'
        WHEN logo_url = '/logos/augustanational.png' THEN 'Augusta Logo'
        WHEN logo_url = '/logos/Pebblebeach.png' THEN 'Pebble Beach Logo'
        WHEN logo_url = '/logos/Mccabe.png' THEN 'McCabe Logo'
        ELSE 'Other'
    END
ORDER BY course_count DESC;
