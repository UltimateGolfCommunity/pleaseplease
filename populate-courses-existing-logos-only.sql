-- Populate Golf Courses from Existing Logos Only
-- This script adds golf courses only for logos that actually exist in the public/logos folder
-- Uses golfcoursedefaultimage.png as the default fallback logo

-- Clear existing courses first (optional - remove this section if you want to keep existing courses)
-- DELETE FROM course_reviews WHERE course_id IN (SELECT id FROM golf_courses);
-- DELETE FROM tee_times WHERE course_id IN (SELECT id FROM golf_courses);
-- DELETE FROM tee_time_applications WHERE tee_time_id IN (SELECT id FROM tee_times WHERE course_id IN (SELECT id FROM golf_courses));
-- DELETE FROM golf_rounds WHERE course_id IN (SELECT id FROM golf_courses);
-- DELETE FROM golf_courses;

-- Insert golf courses based on available logos (only those that exist in public/logos folder)
INSERT INTO golf_courses (id, name, location, description, course_type, par, holes, course_image_url, logo_url, created_at, updated_at) VALUES

-- Courses with confirmed existing logos
(gen_random_uuid(), 'Augusta National Golf Club', 'Augusta, GA', 'Home of The Masters Tournament. One of the most prestigious golf courses in the world, known for its pristine conditions and iconic holes like Amen Corner.', 'private', 72, 18, '/logos/augusta_national_golf_club_text_logo.png', '/logos/augustanational.png', NOW(), NOW()),

(gen_random_uuid(), 'Pebble Beach Golf Links', 'Pebble Beach, CA', 'Iconic oceanside golf course featuring dramatic cliffs and stunning Pacific Ocean views. Host of multiple U.S. Opens and one of the most photographed courses in the world.', 'public', 72, 18, '/logos/pebble_beach_golf_links_text_logo.png', '/logos/Pebblebeach.png', NOW(), NOW()),

(gen_random_uuid(), 'Bandon Dunes Golf Resort', 'Bandon, OR', 'World-class golf destination featuring multiple championship courses with dramatic coastal views and authentic links-style golf.', 'public', 72, 18, '/logos/bandonlogo.jpeg', '/logos/bandonlogo.jpeg', NOW(), NOW()),

(gen_random_uuid(), 'Bethpage Black', 'Farmingdale, NY', 'Challenging public golf course that has hosted multiple major championships. Known for its difficulty and the famous "Warning" sign.', 'public', 71, 18, '/logos/bethpagelogo.png', '/logos/bethpagelogo.png', NOW(), NOW()),

(gen_random_uuid(), 'Carnoustie Golf Links', 'Carnoustie, Scotland', 'Historic links course in Scotland, one of the Open Championship venues. Known for its challenging conditions and the famous "Carnoustie Effect".', 'public', 72, 18, '/logos/carnoustielogo.png', '/logos/carnoustielogo.png', NOW(), NOW()),

(gen_random_uuid(), 'Chambers Bay', 'University Place, WA', 'Links-style golf course built on a former sand and gravel quarry. Host of the 2015 U.S. Open with stunning Puget Sound views.', 'public', 72, 18, '/logos/chambersbay.svg', '/logos/chambersbay.svg', NOW(), NOW()),

(gen_random_uuid(), 'Streamsong Resort', 'Streamsong, FL', 'Unique golf destination featuring three championship courses built on reclaimed phosphate mining land. Known for its dramatic elevation changes.', 'public', 72, 18, '/logos/streamsonglogo.png', '/logos/streamsonglogo.png', NOW(), NOW()),

(gen_random_uuid(), 'Woodmont Golf & Country Club', 'Nashville, TN', 'Exclusive private club featuring two championship courses. Known for its challenging layout and pristine conditions.', 'private', 72, 18, '/logos/woodmont_golf_and_country_club_text_logo.png', '/logos/woodmont.png', NOW(), NOW()),

(gen_random_uuid(), 'The Club at Lake Arrowhead', 'Nashville, TN', 'Private golf club with beautiful lake views and challenging course design. Exclusive membership with exceptional amenities.', 'private', 72, 18, '/logos/the_club_at_lake_arrowhead_text_logo.png', '/logos/arrowhead.png', NOW(), NOW()),

(gen_random_uuid(), 'Hermitage Golf Course', 'Nashville, TN', 'Historic golf course located on the grounds of The Hermitage, Andrew Jacksons former home. Features two championship courses with rich history.', 'public', 72, 18, '/logos/hermitage_golf_course_text_logo.png', '/logos/hermitagegolfcourse.jpeg', NOW(), NOW()),

(gen_random_uuid(), 'McCabe Golf Course', 'Nashville, TN', 'Popular public golf course in Nashville featuring an 18-hole championship layout. Known for its accessibility and quality conditions.', 'public', 71, 18, '/logos/Mccabe.png', '/logos/Mccabe.png', NOW(), NOW()),

(gen_random_uuid(), 'Ted Rhodes Golf Course', 'Nashville, TN', 'Historic public golf course named after professional golfer Ted Rhodes. Features an 18-hole championship course with challenging water hazards.', 'public', 72, 18, '/logos/TedRhodeslogo.jpg', '/logos/TedRhodeslogo.jpg', NOW(), NOW()),

-- Additional courses using default logo for variety
(gen_random_uuid(), 'Gaylord Springs Golf Links', 'Nashville, TN', 'Championship golf course designed by Larry Nelson. Features Scottish-style links with challenging water features and beautiful landscaping.', 'public', 72, 18, '/logos/golfcoursedefaultimage.png', '/logos/golfcoursedefaultimage.png', NOW(), NOW()),

(gen_random_uuid(), 'The Honors Course', 'Ooltewah, TN', 'Exclusive private golf course designed by Pete Dye. Known for its challenging design and pristine conditions. Host of multiple amateur championships.', 'private', 72, 18, '/logos/golfcoursedefaultimage.png', '/logos/golfcoursedefaultimage.png', NOW(), NOW()),

(gen_random_uuid(), 'Torrey Pines Golf Course', 'La Jolla, CA', 'Iconic public golf course overlooking the Pacific Ocean. Features two championship courses and has hosted multiple PGA Tour events including the U.S. Open.', 'public', 72, 18, '/logos/golfcoursedefaultimage.png', '/logos/golfcoursedefaultimage.png', NOW(), NOW()),

(gen_random_uuid(), 'Local Municipal Course', 'Various Locations', 'Community golf course providing affordable golf access to local residents. Features well-maintained greens and fairways.', 'public', 71, 18, '/logos/golfcoursedefaultimage.png', '/logos/golfcoursedefaultimage.png', NOW(), NOW()),

(gen_random_uuid(), 'Executive Golf Course', 'Various Locations', 'Shorter 9-hole or executive course perfect for beginners and those looking for a quick round. Great for practice and casual play.', 'public', 62, 9, '/logos/golfcoursedefaultimage.png', '/logos/golfcoursedefaultimage.png', NOW(), NOW()),

(gen_random_uuid(), 'Resort Golf Course', 'Various Locations', 'Championship golf course at a luxury resort. Features beautiful landscaping, challenging design, and world-class amenities.', 'public', 72, 18, '/logos/golfcoursedefaultimage.png', '/logos/golfcoursedefaultimage.png', NOW(), NOW()),

(gen_random_uuid(), 'Country Club Course', 'Various Locations', 'Private country club featuring an exclusive golf course with premium conditions and member-only access.', 'private', 72, 18, '/logos/golfcoursedefaultimage.png', '/logos/golfcoursedefaultimage.png', NOW(), NOW()),

(gen_random_uuid(), 'Championship Course', 'Various Locations', 'Tournament-ready golf course designed for competitive play. Features challenging hazards and championship-level conditions.', 'public', 72, 18, '/logos/golfcoursedefaultimage.png', '/logos/golfcoursedefaultimage.png', NOW(), NOW()),

(gen_random_uuid(), 'Links Golf Course', 'Various Locations', 'Traditional links-style golf course featuring natural dunes, challenging winds, and fast-running fairways.', 'public', 72, 18, '/logos/golfcoursedefaultimage.png', '/logos/golfcoursedefaultimage.png', NOW(), NOW()),

(gen_random_uuid(), 'Mountain Golf Course', 'Various Locations', 'Scenic mountain golf course with dramatic elevation changes and breathtaking views. Challenging terrain with unique shot-making opportunities.', 'public', 72, 18, '/logos/golfcoursedefaultimage.png', '/logos/golfcoursedefaultimage.png', NOW(), NOW());

-- Verify the insertion
SELECT 
    COUNT(*) as total_courses,
    COUNT(CASE WHEN course_image_url != '/logos/golfcoursedefaultimage.png' THEN 1 END) as courses_with_custom_logos,
    COUNT(CASE WHEN course_image_url = '/logos/golfcoursedefaultimage.png' THEN 1 END) as courses_with_default_logos
FROM golf_courses;

-- Show all inserted courses with their logo information
SELECT 
    name,
    location,
    course_type,
    par,
    holes,
    course_image_url,
    logo_url,
    CASE 
        WHEN course_image_url = '/logos/golfcoursedefaultimage.png' THEN 'Default Logo'
        ELSE 'Custom Logo'
    END as logo_type
FROM golf_courses 
ORDER BY 
    CASE WHEN course_image_url = '/logos/golfcoursedefaultimage.png' THEN 1 ELSE 0 END,
    name;

-- Success message
SELECT 'Successfully populated golf courses from existing logos! Courses with custom logos: ' || 
       COUNT(CASE WHEN course_image_url != '/logos/golfcoursedefaultimage.png' THEN 1 END) ||
       ', Courses with default logos: ' ||
       COUNT(CASE WHEN course_image_url = '/logos/golfcoursedefaultimage.png' THEN 1 END) ||
       ', Total courses: ' || COUNT(*) as message
FROM golf_courses;
