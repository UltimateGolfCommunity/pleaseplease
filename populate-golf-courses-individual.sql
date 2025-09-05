-- Individual Golf Course Inserts (One by One)
-- Run this in your Supabase SQL Editor after running enhance-golf-courses-schema.sql

-- Insert courses one by one to avoid VALUES list issues

-- Course 1: Pebble Beach
INSERT INTO golf_courses (
    name, location, description, par, holes, course_image_url, logo_url, 
    website_url, phone, email, address, city, state, zip_code, country,
    latitude, longitude, course_type, green_fees_min, green_fees_max, 
    cart_fees, caddie_available, pro_shop, restaurant, driving_range, 
    putting_green, practice_facilities, lessons_available, dress_code,
    booking_policy, cancellation_policy, is_featured, is_active
) VALUES (
    'Pebble Beach Golf Links', 'Pebble Beach, CA', 'Iconic coastal golf course with stunning ocean views.', 72, 18, 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop', 'https://www.pebblebeach.com', '(831) 624-3811', 'info@pebblebeach.com', '1700 17-Mile Drive', 'Pebble Beach', 'CA', '93953', 'USA', 36.5681, -121.9506, 'resort', 595, 595, 45, true, true, true, true, true, true, true, 'Collared shirts required', 'Advance booking recommended', '24-hour cancellation policy', true, true
);

-- Course 2: Augusta National
INSERT INTO golf_courses (
    name, location, description, par, holes, course_image_url, logo_url, 
    website_url, phone, email, address, city, state, zip_code, country,
    latitude, longitude, course_type, green_fees_min, green_fees_max, 
    cart_fees, caddie_available, pro_shop, restaurant, driving_range, 
    putting_green, practice_facilities, lessons_available, dress_code,
    booking_policy, cancellation_policy, is_featured, is_active
) VALUES (
    'Augusta National Golf Club', 'Augusta, GA', 'Home of the Masters Tournament with pristine conditions.', 72, 18, 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop', 'https://www.augusta.com', '(706) 667-6000', 'info@augusta.com', '2604 Washington Rd', 'Augusta', 'GA', '30904', 'USA', 33.5030, -82.0199, 'private', 0, 0, 0, true, true, true, true, true, true, true, 'Traditional golf attire required', 'Members only', 'Members only', true, true
);

-- Course 3: St. Andrews
INSERT INTO golf_courses (
    name, location, description, par, holes, course_image_url, logo_url, 
    website_url, phone, email, address, city, state, zip_code, country,
    latitude, longitude, course_type, green_fees_min, green_fees_max, 
    cart_fees, caddie_available, pro_shop, restaurant, driving_range, 
    putting_green, practice_facilities, lessons_available, dress_code,
    booking_policy, cancellation_policy, is_featured, is_active
) VALUES (
    'St. Andrews Old Course', 'St. Andrews, Scotland', 'The Home of Golf with famous Swilcan Bridge.', 72, 18, 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop', 'https://www.standrews.com', '+44 1334 466666', 'info@standrews.com', 'The Links', 'St. Andrews', 'Fife', 'KY16 9XL', 'Scotland', 56.3398, -2.8007, 'public', 195, 195, 0, false, true, true, true, true, true, true, 'Traditional golf attire', 'Ballot system for non-members', '24-hour cancellation', true, true
);

-- Course 4: Cypress Point
INSERT INTO golf_courses (
    name, location, description, par, holes, course_image_url, logo_url, 
    website_url, phone, email, address, city, state, zip_code, country,
    latitude, longitude, course_type, green_fees_min, green_fees_max, 
    cart_fees, caddie_available, pro_shop, restaurant, driving_range, 
    putting_green, practice_facilities, lessons_available, dress_code,
    booking_policy, cancellation_policy, is_featured, is_active
) VALUES (
    'Cypress Point Club', 'Pebble Beach, CA', 'Exclusive private club with dramatic ocean views.', 72, 18, 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop', 'https://www.cypresspointclub.com', '(831) 624-3811', 'info@cypresspoint.com', '1700 17-Mile Drive', 'Pebble Beach', 'CA', '93953', 'USA', 36.5681, -121.9506, 'private', 0, 0, 0, true, true, true, true, true, true, true, 'Traditional golf attire', 'Members only', 'Members only', true, true
);

-- Course 5: Pine Valley
INSERT INTO golf_courses (
    name, location, description, par, holes, course_image_url, logo_url, 
    website_url, phone, email, address, city, state, zip_code, country,
    latitude, longitude, course_type, green_fees_min, green_fees_max, 
    cart_fees, caddie_available, pro_shop, restaurant, driving_range, 
    putting_green, practice_facilities, lessons_available, dress_code,
    booking_policy, cancellation_policy, is_featured, is_active
) VALUES (
    'Pine Valley Golf Club', 'Pine Valley, NJ', 'Consistently ranked as the #1 golf course in the world.', 70, 18, 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop', 'https://www.pinevalleygolfclub.com', '(856) 783-3000', 'info@pinevalley.com', '1 Pine Valley Rd', 'Pine Valley', 'NJ', '08021', 'USA', 39.7844, -74.9822, 'private', 0, 0, 0, true, true, true, true, true, true, true, 'Traditional golf attire', 'Members only', 'Members only', true, true
);

-- Course 6: Whistling Straits
INSERT INTO golf_courses (
    name, location, description, par, holes, course_image_url, logo_url, 
    website_url, phone, email, address, city, state, zip_code, country,
    latitude, longitude, course_type, green_fees_min, green_fees_max, 
    cart_fees, caddie_available, pro_shop, restaurant, driving_range, 
    putting_green, practice_facilities, lessons_available, dress_code,
    booking_policy, cancellation_policy, is_featured, is_active
) VALUES (
    'Whistling Straits', 'Haven, WI', 'Championship course with dramatic lake views.', 72, 18, 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop', 'https://www.destinationkohler.com', '(920) 565-6000', 'info@destinationkohler.com', '8500 County Road LS', 'Haven', 'WI', '53043', 'USA', 43.8414, -87.7314, 'resort', 295, 295, 25, true, true, true, true, true, true, true, 'Collared shirts required', 'Advance booking recommended', '24-hour cancellation', true, true
);

-- Course 7: Bandon Dunes
INSERT INTO golf_courses (
    name, location, description, par, holes, course_image_url, logo_url, 
    website_url, phone, email, address, city, state, zip_code, country,
    latitude, longitude, course_type, green_fees_min, green_fees_max, 
    cart_fees, caddie_available, pro_shop, restaurant, driving_range, 
    putting_green, practice_facilities, lessons_available, dress_code,
    booking_policy, cancellation_policy, is_featured, is_active
) VALUES (
    'Bandon Dunes Golf Resort', 'Bandon, OR', 'Authentic links golf experience with Pacific Ocean views.', 72, 18, 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop', 'https://www.bandondunesgolf.com', '(541) 347-4380', 'info@bandondunes.com', '57744 Round Lake Rd', 'Bandon', 'OR', '97411', 'USA', 43.1181, -124.4081, 'resort', 295, 295, 25, true, true, true, true, true, true, true, 'Traditional golf attire', 'Advance booking required', '48-hour cancellation', true, true
);

-- Course 8: Kiawah Island
INSERT INTO golf_courses (
    name, location, description, par, holes, course_image_url, logo_url, 
    website_url, phone, email, address, city, state, zip_code, country,
    latitude, longitude, course_type, green_fees_min, green_fees_max, 
    cart_fees, caddie_available, pro_shop, restaurant, driving_range, 
    putting_green, practice_facilities, lessons_available, dress_code,
    booking_policy, cancellation_policy, is_featured, is_active
) VALUES (
    'Kiawah Island Ocean Course', 'Kiawah Island, SC', 'Pete Dye masterpiece with challenging ocean winds.', 72, 18, 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop', 'https://www.kiawahresort.com', '(843) 768-2121', 'info@kiawahresort.com', '1 Sanctuary Beach Dr', 'Kiawah Island', 'SC', '29455', 'USA', 32.6081, -80.0814, 'resort', 395, 395, 35, true, true, true, true, true, true, true, 'Collared shirts required', 'Resort guests priority', '24-hour cancellation', true, true
);

-- Course 9: TPC Sawgrass
INSERT INTO golf_courses (
    name, location, description, par, holes, course_image_url, logo_url, 
    website_url, phone, email, address, city, state, zip_code, country,
    latitude, longitude, course_type, green_fees_min, green_fees_max, 
    cart_fees, caddie_available, pro_shop, restaurant, driving_range, 
    putting_green, practice_facilities, lessons_available, dress_code,
    booking_policy, cancellation_policy, is_featured, is_active
) VALUES (
    'TPC Sawgrass', 'Ponte Vedra Beach, FL', 'Home of THE PLAYERS Championship with island green.', 72, 18, 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop', 'https://www.tpc.com', '(904) 273-3235', 'info@tpc.com', '110 Championship Way', 'Ponte Vedra Beach', 'FL', '32082', 'USA', 30.2041, -81.3847, 'public', 450, 450, 40, true, true, true, true, true, true, true, 'Collared shirts required', 'Advance booking recommended', '24-hour cancellation', true, true
);

-- Course 10: Shadow Creek
INSERT INTO golf_courses (
    name, location, description, par, holes, course_image_url, logo_url, 
    website_url, phone, email, address, city, state, zip_code, country,
    latitude, longitude, course_type, green_fees_min, green_fees_max, 
    cart_fees, caddie_available, pro_shop, restaurant, driving_range, 
    putting_green, practice_facilities, lessons_available, dress_code,
    booking_policy, cancellation_policy, is_featured, is_active
) VALUES (
    'Shadow Creek', 'North Las Vegas, NV', 'Exclusive Tom Fazio design with dramatic elevation changes.', 72, 18, 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop', 'https://www.shadowcreek.com', '(702) 791-7161', 'info@shadowcreek.com', '3 Shadow Creek Dr', 'North Las Vegas', 'NV', '89031', 'USA', 36.2847, -115.1394, 'private', 0, 0, 0, true, true, true, true, true, true, true, 'Traditional golf attire', 'Invitation only', 'Invitation only', true, true
);

-- Verify the data was inserted
SELECT 'Golf courses populated successfully!' AS status, COUNT(*) AS total_courses FROM golf_courses;
