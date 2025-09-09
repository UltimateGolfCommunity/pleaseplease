-- Update Woodmont Golf & Country Club with Real Logo
-- This script updates Woodmont Golf & Country Club with their actual logo
-- Run this in your Supabase SQL Editor

-- First, upload the Woodmont logo to Supabase Storage
-- Then replace the URL below with the actual Supabase storage URL

UPDATE golf_courses SET 
    logo_url = 'https://your-project.supabase.co/storage/v1/object/public/course-logos/woodmont-logo.png',
    course_image_url = 'https://your-project.supabase.co/storage/v1/object/public/course-logos/woodmont-course-image.jpg'
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
        WHEN logo_url IS NULL OR logo_url = '' THEN '❌ Needs Logo'
        ELSE '✅ Has Logo'
    END as logo_status
FROM golf_courses 
ORDER BY logo_status DESC, name;
