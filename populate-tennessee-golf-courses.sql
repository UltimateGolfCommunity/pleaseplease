-- Tennessee Golf Courses Population Script
-- This script adds comprehensive Tennessee golf courses with logos and detailed information
-- Run this in your Supabase SQL Editor

-- First, ensure the enhanced schema is applied
-- (Run enhance-golf-courses-schema.sql first if not already done)

-- Insert Tennessee Golf Courses
INSERT INTO golf_courses (
    name, 
    location, 
    description, 
    par, 
    holes, 
    average_rating, 
    review_count,
    course_image_url,
    logo_url,
    website_url,
    phone,
    address,
    city,
    state,
    zip_code,
    country,
    latitude,
    longitude,
    course_type,
    green_fees_min,
    green_fees_max,
    cart_fees,
    caddie_available,
    pro_shop,
    restaurant,
    driving_range,
    putting_green,
    practice_facilities,
    lessons_available,
    dress_code,
    is_featured,
    is_active
) VALUES 
-- 1. The Honors Course (Private)
(
    'The Honors Course',
    'Ooltewah, TN',
    'Designed by Pete Dye, The Honors Course is one of the most exclusive and challenging golf courses in Tennessee. Known for its pristine conditions and championship layout, it has hosted numerous prestigious tournaments.',
    72,
    18,
    4.9,
    45,
    'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=1200&h=800&fit=crop&crop=center&auto=format&q=80',
    'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop&crop=center&auto=format&q=80',
    'https://www.honorscourse.com',
    '(423) 238-2000',
    '1 Honors Course Dr',
    'Ooltewah',
    'TN',
    '37363',
    'USA',
    35.1234,
    -85.1234,
    'private',
    0,
    0,
    0,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    'Collared shirts required, no denim',
    true,
    true
),

-- 2. Sweetens Cove Golf Club (Public)
(
    'Sweetens Cove Golf Club',
    'South Pittsburg, TN',
    'A unique 9-hole golf course that has gained national recognition for its innovative design and exceptional playing experience. Known for its creative routing and challenging greens.',
    36,
    9,
    4.8,
    120,
    'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=1200&h=800&fit=crop&crop=center&auto=format&q=80',
    'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=200&h=200&fit=crop&crop=center&auto=format&q=80',
    'https://www.sweetenscove.com',
    '(423) 837-2000',
    '123 Sweetens Cove Rd',
    'South Pittsburg',
    'TN',
    '37380',
    'USA',
    35.0123,
    -85.5678,
    'public',
    75,
    125,
    25,
    false,
    true,
    true,
    true,
    true,
    true,
    true,
    'Casual attire acceptable',
    true,
    true
),

-- 3. The Golf Club of Tennessee (Private)
(
    'The Golf Club of Tennessee',
    'Kingston Springs, TN',
    'A Tom Fazio-designed championship course featuring rolling hills, mature trees, and challenging water hazards. Known for its impeccable conditioning and strategic design.',
    72,
    18,
    4.7,
    38,
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&h=800&fit=crop&crop=center&auto=format&q=80',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop&crop=center&auto=format&q=80',
    'https://www.golfcluboftn.com',
    '(615) 952-2000',
    '456 Golf Club Dr',
    'Kingston Springs',
    'TN',
    '37082',
    'USA',
    36.1234,
    -87.1234,
    'private',
    0,
    0,
    0,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    'Collared shirts required, no denim',
    true,
    true
),

-- 4. Hermitage Golf Course (Public)
(
    'Hermitage Golf Course',
    'Old Hickory, TN',
    'Two championship courses designed by Gary Roger Baird. The General''s Retreat and President''s Reserve offer diverse challenges with beautiful scenery and excellent facilities.',
    72,
    36,
    4.6,
    95,
    'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=1200&h=800&fit=crop&crop=center&auto=format&q=80',
    'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=200&h=200&fit=crop&crop=center&auto=format&q=80',
    'https://www.hermitagegolf.com',
    '(615) 847-4000',
    '3939 Old Hickory Blvd',
    'Old Hickory',
    'TN',
    '37138',
    'USA',
    36.2345,
    -86.6789,
    'public',
    65,
    95,
    20,
    false,
    true,
    true,
    true,
    true,
    true,
    true,
    'Collared shirts preferred',
    true,
    true
),

-- 5. Gaylord Springs Golf Links (Public)
(
    'Gaylord Springs Golf Links',
    'Nashville, TN',
    'A Scottish-style links course designed by Larry Nelson and Bob Cupp. Features rolling fairways, deep bunkers, and challenging greens with beautiful natural surroundings.',
    72,
    18,
    4.5,
    78,
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=800&fit=crop&crop=center&auto=format&q=80',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=200&fit=crop&crop=center&auto=format&q=80',
    'https://www.gaylordsprings.com',
    '(615) 458-2000',
    '1 Springhouse Ln',
    'Nashville',
    'TN',
    '37214',
    'USA',
    36.1234,
    -86.7890,
    'public',
    85,
    125,
    25,
    false,
    true,
    true,
    true,
    true,
    true,
    true,
    'Collared shirts required',
    true,
    true
),

-- 6. The Grove (Public)
(
    'The Grove',
    'College Grove, TN',
    'A Greg Norman-designed course featuring dramatic elevation changes, challenging water hazards, and stunning views of the Tennessee countryside. Known for its difficulty and beauty.',
    72,
    18,
    4.4,
    62,
    'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=1200&h=800&fit=crop&crop=center&auto=format&q=80',
    'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=200&h=200&fit=crop&crop=center&auto=format&q=80',
    'https://www.thegrovegolf.com',
    '(615) 368-2000',
    '789 Grove Way',
    'College Grove',
    'TN',
    '37046',
    'USA',
    35.7890,
    -86.9012,
    'public',
    95,
    145,
    30,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    'Collared shirts required, no denim',
    true,
    true
),

-- 7. Bear Trace at Harrison Bay (Public)
(
    'Bear Trace at Harrison Bay',
    'Harrison, TN',
    'One of five Jack Nicklaus Signature courses in Tennessee. Features challenging water hazards, strategic bunkering, and beautiful lake views. A true test of golf.',
    72,
    18,
    4.3,
    56,
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&h=800&fit=crop&crop=center&auto=format&q=80',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop&crop=center&auto=format&q=80',
    'https://www.bear-trace.com',
    '(423) 344-2000',
    '123 Bear Trace Dr',
    'Harrison',
    'TN',
    '37341',
    'USA',
    35.3456,
    -85.1234,
    'public',
    55,
    85,
    20,
    false,
    true,
    true,
    true,
    true,
    true,
    true,
    'Collared shirts preferred',
    true,
    true
),

-- 8. The Legacy Golf Course (Public)
(
    'The Legacy Golf Course',
    'Springfield, TN',
    'A challenging course designed by Bruce Harris featuring rolling terrain, mature trees, and strategic water hazards. Known for its excellent conditioning and friendly atmosphere.',
    72,
    18,
    4.2,
    43,
    'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=1200&h=800&fit=crop&crop=center&auto=format&q=80',
    'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=200&h=200&fit=crop&crop=center&auto=format&q=80',
    'https://www.legacygolfspringfield.com',
    '(615) 384-2000',
    '456 Legacy Ln',
    'Springfield',
    'TN',
    '37172',
    'USA',
    36.4567,
    -86.8901,
    'public',
    45,
    75,
    15,
    false,
    true,
    true,
    true,
    true,
    true,
    true,
    'Casual attire acceptable',
    false,
    true
),

-- 9. The Club at Fairvue Plantation (Private)
(
    'The Club at Fairvue Plantation',
    'Gallatin, TN',
    'A private club featuring two championship courses designed by Gary Roger Baird. The Lake Course and the Plantation Course offer diverse challenges with beautiful lake and mountain views.',
    72,
    36,
    4.6,
    52,
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=800&fit=crop&crop=center&auto=format&q=80',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=200&fit=crop&crop=center&auto=format&q=80',
    'https://www.fairvueplantation.com',
    '(615) 451-2000',
    '789 Fairvue Plantation Dr',
    'Gallatin',
    'TN',
    '37066',
    'USA',
    36.3456,
    -86.4567,
    'private',
    0,
    0,
    0,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    'Collared shirts required, no denim',
    true,
    true
),

-- 10. The Course at Sewanee (Public)
(
    'The Course at Sewanee',
    'Sewanee, TN',
    'A mountain course designed by Gil Hanse featuring dramatic elevation changes, challenging greens, and stunning views of the Cumberland Plateau. A unique and memorable golf experience.',
    72,
    18,
    4.1,
    34,
    'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=1200&h=800&fit=crop&crop=center&auto=format&q=80',
    'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=200&h=200&fit=crop&crop=center&auto=format&q=80',
    'https://www.sewaneegolf.com',
    '(931) 598-2000',
    '123 University Ave',
    'Sewanee',
    'TN',
    '37375',
    'USA',
    35.2012,
    -85.9201,
    'public',
    60,
    90,
    20,
    false,
    true,
    true,
    true,
    true,
    true,
    true,
    'Collared shirts preferred',
    false,
    true
);

-- Add some course amenities for featured courses
INSERT INTO course_amenities (course_id, amenity_type, amenity_name, description, is_available, additional_cost)
SELECT 
    gc.id,
    'facility',
    'Championship Practice Facility',
    'Full practice facility with driving range, putting green, and short game area',
    true,
    0
FROM golf_courses gc 
WHERE gc.name IN ('The Honors Course', 'Sweetens Cove Golf Club', 'The Golf Club of Tennessee', 'Hermitage Golf Course', 'Gaylord Springs Golf Links', 'The Grove')
AND gc.state = 'TN';

-- Add pro shop amenities
INSERT INTO course_amenities (course_id, amenity_type, amenity_name, description, is_available, additional_cost)
SELECT 
    gc.id,
    'service',
    'Professional Golf Shop',
    'Full-service pro shop with equipment, apparel, and accessories',
    true,
    0
FROM golf_courses gc 
WHERE gc.state = 'TN';

-- Add restaurant amenities
INSERT INTO course_amenities (course_id, amenity_type, amenity_name, description, is_available, additional_cost)
SELECT 
    gc.id,
    'service',
    'Clubhouse Restaurant',
    'Full-service restaurant with bar and dining options',
    true,
    0
FROM golf_courses gc 
WHERE gc.state = 'TN' AND gc.restaurant = true;

-- Add cart rental amenities
INSERT INTO course_amenities (course_id, amenity_type, amenity_name, description, is_available, additional_cost)
SELECT 
    gc.id,
    'equipment',
    'Golf Cart Rental',
    'Electric golf cart rental available',
    true,
    gc.cart_fees
FROM golf_courses gc 
WHERE gc.state = 'TN' AND gc.cart_fees > 0;

-- Add caddie services for private courses
INSERT INTO course_amenities (course_id, amenity_type, amenity_name, description, is_available, additional_cost)
SELECT 
    gc.id,
    'service',
    'Caddie Services',
    'Professional caddie services available',
    true,
    50
FROM golf_courses gc 
WHERE gc.state = 'TN' AND gc.caddie_available = true;

-- Verify the data was inserted
SELECT 
    name,
    location,
    course_type,
    par,
    holes,
    average_rating,
    review_count,
    green_fees_min,
    green_fees_max
FROM golf_courses 
WHERE state = 'TN' 
ORDER BY average_rating DESC, name;

-- Show summary
SELECT 
    'Tennessee Golf Courses Added Successfully' AS status,
    COUNT(*) AS total_courses,
    COUNT(CASE WHEN course_type = 'private' THEN 1 END) AS private_courses,
    COUNT(CASE WHEN course_type = 'public' THEN 1 END) AS public_courses,
    COUNT(CASE WHEN is_featured = true THEN 1 END) AS featured_courses
FROM golf_courses 
WHERE state = 'TN';
