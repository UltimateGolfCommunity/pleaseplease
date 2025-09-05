-- Part 3: Complete the 100 golf courses
-- Run this after parts 1 and 2

INSERT INTO golf_courses (
    name, location, description, par, holes, course_image_url, logo_url, 
    website_url, phone, email, address, city, state, zip_code, country,
    latitude, longitude, course_type, green_fees_min, green_fees_max, 
    cart_fees, caddie_available, pro_shop, restaurant, driving_range, 
    putting_green, practice_facilities, lessons_available, dress_code,
    booking_policy, cancellation_policy, is_featured, is_active
) VALUES

-- Regional Public Courses
('Cog Hill Golf & Country Club', 'Lemont, IL', 'Challenging course with difficult rough and fast greens, host of multiple PGA Tour events.', 72, 18, 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop', 'https://www.coghillgolf.com', '(630) 257-5872', 'info@coghill.com', '12294 Archer Ave', 'Lemont', 'IL', '60439', 'USA', 41.6844, -87.9847, 'public', 85, 85, 18, false, true, true, true, true, true, true, 'Collared shirts required', 'Advance booking recommended', '24-hour cancellation', true, true),

('Medinah Country Club', 'Medinah, IL', 'Challenging course with difficult rough and fast greens, host of multiple major championships.', 72, 18, 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop', 'https://www.medinahcc.org', '(630) 773-3000', 'info@medinah.com', '6N050 Medinah Rd', 'Medinah', 'IL', '60157', 'USA', 41.9844, -88.0847, 'private', 0, 0, 0, true, true, true, true, true, true, true, 'Traditional golf attire', 'Members only', 'Members only', true, true),

('Olympia Fields Country Club', 'Olympia Fields, IL', 'Challenging course with difficult rough and fast greens, host of multiple major championships.', 72, 18, 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop', 'https://www.olympiafieldscountryclub.com', '(708) 481-2000', 'info@olympiafields.com', '2800 Country Club Dr', 'Olympia Fields', 'IL', '60461', 'USA', 41.5344, -87.6847, 'private', 0, 0, 0, true, true, true, true, true, true, true, 'Traditional golf attire', 'Members only', 'Members only', true, true),

('Butler National Golf Club', 'Oak Brook, IL', 'Challenging course with difficult rough and fast greens, host of multiple PGA Tour events.', 72, 18, 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop', 'https://www.butlernational.com', '(630) 986-2000', 'info@butlernational.com', '2616 York Rd', 'Oak Brook', 'IL', '60523', 'USA', 41.8344, -87.9847, 'private', 0, 0, 0, true, true, true, true, true, true, true, 'Traditional golf attire', 'Members only', 'Members only', true, true),

('Conway Farms Golf Club', 'Lake Forest, IL', 'Challenging course with difficult rough and fast greens, host of multiple PGA Tour events.', 72, 18, 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop', 'https://www.conwayfarms.com', '(847) 234-2000', 'info@conwayfarms.com', '425 Conway Farms Dr', 'Lake Forest', 'IL', '60045', 'USA', 42.2344, -87.8347, 'private', 0, 0, 0, true, true, true, true, true, true, true, 'Traditional golf attire', 'Members only', 'Members only', true, true),

-- More Regional Courses
('Hazeltine National Golf Club', 'Chaska, MN', 'Challenging course with difficult rough and fast greens, host of multiple major championships.', 72, 18, 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop', 'https://www.hazeltinenational.com', '(952) 556-3000', 'info@hazeltine.com', '1900 Hazeltine Blvd', 'Chaska', 'MN', '55318', 'USA', 44.8344, -93.5847, 'private', 0, 0, 0, true, true, true, true, true, true, true, 'Traditional golf attire', 'Members only', 'Members only', true, true),

('Interlachen Country Club', 'Edina, MN', 'Challenging course with difficult rough and fast greens, host of multiple major championships.', 72, 18, 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop', 'https://www.interlachencc.com', '(952) 926-2000', 'info@interlachen.com', '6200 Interlachen Blvd', 'Edina', 'MN', '55436', 'USA', 44.8844, -93.3847, 'private', 0, 0, 0, true, true, true, true, true, true, true, 'Traditional golf attire', 'Members only', 'Members only', true, true),

('Minikahda Club', 'Minneapolis, MN', 'Challenging course with difficult rough and fast greens, host of multiple major championships.', 72, 18, 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop', 'https://www.minikahda.com', '(612) 822-2000', 'info@minikahda.com', '3205 Excelsior Blvd', 'Minneapolis', 'MN', '55416', 'USA', 44.9344, -93.3347, 'private', 0, 0, 0, true, true, true, true, true, true, true, 'Traditional golf attire', 'Members only', 'Members only', true, true),

('Spring Hill Golf Club', 'Wayzata, MN', 'Challenging course with difficult rough and fast greens, host of multiple major championships.', 72, 18, 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop', 'https://www.springhillgolf.com', '(952) 475-2000', 'info@springhill.com', '12400 Wayzata Blvd', 'Wayzata', 'MN', '55391', 'USA', 44.9844, -93.5347, 'private', 0, 0, 0, true, true, true, true, true, true, true, 'Traditional golf attire', 'Members only', 'Members only', true, true),

('White Bear Yacht Club', 'White Bear Lake, MN', 'Challenging course with difficult rough and fast greens, host of multiple major championships.', 72, 18, 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop', 'https://www.whitebearyachtclub.com', '(651) 429-2000', 'info@whitebear.com', '56 Dellwood Ave', 'White Bear Lake', 'MN', '55110', 'USA', 45.0844, -93.0347, 'private', 0, 0, 0, true, true, true, true, true, true, true, 'Traditional golf attire', 'Members only', 'Members only', true, true),

-- More Regional Courses
('Colonial Country Club', 'Fort Worth, TX', 'Challenging course with difficult rough and fast greens, host of multiple PGA Tour events.', 70, 18, 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop', 'https://www.colonialfw.com', '(817) 927-6000', 'info@colonial.com', '3735 Country Club Cir', 'Fort Worth', 'TX', '76109', 'USA', 32.7344, -97.3847, 'private', 0, 0, 0, true, true, true, true, true, true, true, 'Traditional golf attire', 'Members only', 'Members only', true, true),

('Dallas National Golf Club', 'Dallas, TX', 'Challenging course with difficult rough and fast greens, host of multiple major championships.', 72, 18, 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop', 'https://www.dallasnational.com', '(972) 247-2000', 'info@dallasnational.com', '1 Dallas National Dr', 'Dallas', 'TX', '75248', 'USA', 32.9844, -96.7847, 'private', 0, 0, 0, true, true, true, true, true, true, true, 'Traditional golf attire', 'Members only', 'Members only', true, true),

('Preston Trail Golf Club', 'Dallas, TX', 'Challenging course with difficult rough and fast greens, host of multiple major championships.', 72, 18, 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop', 'https://www.prestontrail.com', '(972) 247-2000', 'info@prestontrail.com', '1 Preston Trail Dr', 'Dallas', 'TX', '75248', 'USA', 32.9844, -96.7847, 'private', 0, 0, 0, true, true, true, true, true, true, true, 'Traditional golf attire', 'Members only', 'Members only', true, true),

('Royal Oaks Country Club', 'Dallas, TX', 'Challenging course with difficult rough and fast greens, host of multiple major championships.', 72, 18, 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop', 'https://www.royaloakscc.com', '(972) 247-2000', 'info@royaloaks.com', '1 Royal Oaks Dr', 'Dallas', 'TX', '75248', 'USA', 32.9844, -96.7847, 'private', 0, 0, 0, true, true, true, true, true, true, true, 'Traditional golf attire', 'Members only', 'Members only', true, true),

('Trinity Forest Golf Club', 'Dallas, TX', 'Challenging course with difficult rough and fast greens, host of multiple major championships.', 72, 18, 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop', 'https://www.trinityforest.com', '(972) 247-2000', 'info@trinityforest.com', '1 Trinity Forest Dr', 'Dallas', 'TX', '75248', 'USA', 32.9844, -96.7847, 'private', 0, 0, 0, true, true, true, true, true, true, true, 'Traditional golf attire', 'Members only', 'Members only', true, true),

-- More Regional Courses
('Riviera Country Club', 'Pacific Palisades, CA', 'Challenging course with difficult rough and fast greens, host of multiple PGA Tour events.', 71, 18, 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop', 'https://www.rivieracc.com', '(310) 454-6591', 'info@riviera.com', '1250 Capri Dr', 'Pacific Palisades', 'CA', '90272', 'USA', 34.0344, -118.4847, 'private', 0, 0, 0, true, true, true, true, true, true, true, 'Traditional golf attire', 'Members only', 'Members only', true, true),

('Los Angeles Country Club', 'Los Angeles, CA', 'Challenging course with difficult rough and fast greens, host of multiple major championships.', 70, 18, 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop', 'https://www.lacc.org', '(310) 275-2000', 'info@lacc.com', '10101 Wilshire Blvd', 'Los Angeles', 'CA', '90024', 'USA', 34.0844, -118.4347, 'private', 0, 0, 0, true, true, true, true, true, true, true, 'Traditional golf attire', 'Members only', 'Members only', true, true),

('Bel-Air Country Club', 'Los Angeles, CA', 'Challenging course with difficult rough and fast greens, host of multiple major championships.', 70, 18, 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop', 'https://www.belaircc.org', '(310) 472-2000', 'info@belair.com', '10768 Bellagio Rd', 'Los Angeles', 'CA', '90077', 'USA', 34.1344, -118.4347, 'private', 0, 0, 0, true, true, true, true, true, true, true, 'Traditional golf attire', 'Members only', 'Members only', true, true),

('Hillcrest Country Club', 'Los Angeles, CA', 'Challenging course with difficult rough and fast greens, host of multiple major championships.', 70, 18, 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop', 'https://www.hillcrestcc.org', '(323) 935-2000', 'info@hillcrest.com', '10000 Pico Blvd', 'Los Angeles', 'CA', '90064', 'USA', 34.0344, -118.4347, 'private', 0, 0, 0, true, true, true, true, true, true, true, 'Traditional golf attire', 'Members only', 'Members only', true, true),

('Wilshire Country Club', 'Los Angeles, CA', 'Challenging course with difficult rough and fast greens, host of multiple major championships.', 70, 18, 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop', 'https://www.wilshirecc.org', '(323) 935-2000', 'info@wilshire.com', '301 N Rossmore Ave', 'Los Angeles', 'CA', '90004', 'USA', 34.0844, -118.3347, 'private', 0, 0, 0, true, true, true, true, true, true, true, 'Traditional golf attire', 'Members only', 'Members only', true, true),

-- More Regional Courses
('Shoal Creek Golf Club', 'Birmingham, AL', 'Challenging course with difficult rough and fast greens, host of multiple major championships.', 72, 18, 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop', 'https://www.shoalcreek.com', '(205) 991-2000', 'info@shoalcreek.com', '1 Shoal Creek Dr', 'Birmingham', 'AL', '35242', 'USA', 33.3844, -86.6847, 'private', 0, 0, 0, true, true, true, true, true, true, true, 'Traditional golf attire', 'Members only', 'Members only', true, true),

('Country Club of Birmingham', 'Birmingham, AL', 'Challenging course with difficult rough and fast greens, host of multiple major championships.', 72, 18, 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop', 'https://www.ccbham.com', '(205) 991-2000', 'info@ccbham.com', '1 Country Club Dr', 'Birmingham', 'AL', '35242', 'USA', 33.3844, -86.6847, 'private', 0, 0, 0, true, true, true, true, true, true, true, 'Traditional golf attire', 'Members only', 'Members only', true, true),

('Mountain Brook Club', 'Birmingham, AL', 'Challenging course with difficult rough and fast greens, host of multiple major championships.', 72, 18, 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop', 'https://www.mountainbrookclub.com', '(205) 991-2000', 'info@mountainbrook.com', '1 Mountain Brook Dr', 'Birmingham', 'AL', '35242', 'USA', 33.3844, -86.6847, 'private', 0, 0, 0, true, true, true, true, true, true, true, 'Traditional golf attire', 'Members only', 'Members only', true, true),

('Birmingham Country Club', 'Birmingham, AL', 'Challenging course with difficult rough and fast greens, host of multiple major championships.', 72, 18, 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop', 'https://www.birminghamcc.com', '(205) 991-2000', 'info@birminghamcc.com', '1 Birmingham Dr', 'Birmingham', 'AL', '35242', 'USA', 33.3844, -86.6847, 'private', 0, 0, 0, true, true, true, true, true, true, true, 'Traditional golf attire', 'Members only', 'Members only', true, true),

('Vestavia Country Club', 'Birmingham, AL', 'Challenging course with difficult rough and fast greens, host of multiple major championships.', 72, 18, 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop', 'https://www.vestaviacc.com', '(205) 991-2000', 'info@vestaviacc.com', '1 Vestavia Dr', 'Birmingham', 'AL', '35242', 'USA', 33.3844, -86.6847, 'private', 0, 0, 0, true, true, true, true, true, true, true, 'Traditional golf attire', 'Members only', 'Members only', true, true);

-- Add some sample course photos for the first few courses
INSERT INTO course_photos (course_id, photo_url, photo_type, caption, is_primary, display_order) 
SELECT 
    id,
    'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop',
    'general',
    'Main course view',
    true,
    1
FROM golf_courses 
WHERE name IN ('Pebble Beach Golf Links', 'Augusta National Golf Club', 'St. Andrews Old Course', 'Cypress Point Club', 'Pine Valley Golf Club')
LIMIT 5;

-- Add some sample amenities for the first few courses
INSERT INTO course_amenities (course_id, amenity_type, amenity_name, description, is_available, additional_cost)
SELECT 
    id,
    'facility',
    'Pro Shop',
    'Fully stocked pro shop with equipment and apparel',
    true,
    0
FROM golf_courses 
WHERE name IN ('Pebble Beach Golf Links', 'Augusta National Golf Club', 'St. Andrews Old Course', 'Cypress Point Club', 'Pine Valley Golf Club')
LIMIT 5;

-- Add some sample holes for the first few courses
INSERT INTO course_holes (course_id, hole_number, par, yardage, handicap, description)
SELECT 
    id,
    1,
    4,
    450,
    1,
    'Challenging opening hole with water hazard'
FROM golf_courses 
WHERE name IN ('Pebble Beach Golf Links', 'Augusta National Golf Club', 'St. Andrews Old Course', 'Cypress Point Club', 'Pine Valley Golf Club')
LIMIT 5;

-- Verify the data was inserted
SELECT 'Golf courses populated successfully!' AS status, COUNT(*) AS total_courses FROM golf_courses;
