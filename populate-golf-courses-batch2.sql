-- Golf Courses Batch 2 (Courses 11-30)
-- Run this after populate-golf-courses-individual.sql

-- Course 11: Bethpage Black
INSERT INTO golf_courses (
    name, location, description, par, holes, course_image_url, logo_url, 
    website_url, phone, email, address, city, state, zip_code, country,
    latitude, longitude, course_type, green_fees_min, green_fees_max, 
    cart_fees, caddie_available, pro_shop, restaurant, driving_range, 
    putting_green, practice_facilities, lessons_available, dress_code,
    booking_policy, cancellation_policy, is_featured, is_active
) VALUES (
    'Bethpage Black', 'Farmingdale, NY', 'Challenging public course that hosted multiple majors.', 71, 18, 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop', 'https://www.bethpagegolfcourse.com', '(516) 249-0700', 'info@bethpage.com', '99 Quaker Meeting House Rd', 'Farmingdale', 'NY', '11735', 'USA', 40.7444, -73.4178, 'public', 75, 75, 15, false, true, true, true, true, true, true, 'Collared shirts required', 'First come, first served', '24-hour cancellation', true, true
);

-- Course 12: Torrey Pines
INSERT INTO golf_courses (
    name, location, description, par, holes, course_image_url, logo_url, 
    website_url, phone, email, address, city, state, zip_code, country,
    latitude, longitude, course_type, green_fees_min, green_fees_max, 
    cart_fees, caddie_available, pro_shop, restaurant, driving_range, 
    putting_green, practice_facilities, lessons_available, dress_code,
    booking_policy, cancellation_policy, is_featured, is_active
) VALUES (
    'Torrey Pines Golf Course', 'La Jolla, CA', 'Municipal course with stunning Pacific Ocean views.', 72, 18, 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop', 'https://www.sandiego.gov', '(858) 581-7177', 'info@torreypines.com', '11480 N Torrey Pines Rd', 'La Jolla', 'CA', '92037', 'USA', 32.8969, -117.2508, 'municipal', 65, 65, 12, false, true, true, true, true, true, true, 'Collared shirts required', 'Advance booking available', '24-hour cancellation', true, true
);

-- Course 13: Chambers Bay
INSERT INTO golf_courses (
    name, location, description, par, holes, course_image_url, logo_url, 
    website_url, phone, email, address, city, state, zip_code, country,
    latitude, longitude, course_type, green_fees_min, green_fees_max, 
    cart_fees, caddie_available, pro_shop, restaurant, driving_range, 
    putting_green, practice_facilities, lessons_available, dress_code,
    booking_policy, cancellation_policy, is_featured, is_active
) VALUES (
    'Chambers Bay', 'University Place, WA', 'Links-style course with dramatic elevation changes.', 72, 18, 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop', 'https://www.chambersbaygolf.com', '(253) 460-4653', 'info@chambersbay.com', '6320 Grandview Dr W', 'University Place', 'WA', '98467', 'USA', 47.2044, -122.5508, 'public', 85, 85, 18, false, true, true, true, true, true, true, 'Traditional golf attire', 'Advance booking recommended', '24-hour cancellation', true, true
);

-- Course 14: Streamsong Resort
INSERT INTO golf_courses (
    name, location, description, par, holes, course_image_url, logo_url, 
    website_url, phone, email, address, city, state, zip_code, country,
    latitude, longitude, course_type, green_fees_min, green_fees_max, 
    cart_fees, caddie_available, pro_shop, restaurant, driving_range, 
    putting_green, practice_facilities, lessons_available, dress_code,
    booking_policy, cancellation_policy, is_featured, is_active
) VALUES (
    'Streamsong Resort', 'Streamsong, FL', 'Modern links-style courses with dramatic sand dunes.', 72, 18, 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop', 'https://www.streamsongresort.com', '(863) 428-1000', 'info@streamsong.com', '1000 Streamsong Dr', 'Streamsong', 'FL', '33834', 'USA', 27.6844, -81.7508, 'resort', 275, 275, 25, true, true, true, true, true, true, true, 'Collared shirts required', 'Resort guests priority', '48-hour cancellation', true, true
);

-- Course 15: Erin Hills
INSERT INTO golf_courses (
    name, location, description, par, holes, course_image_url, logo_url, 
    website_url, phone, email, address, city, state, zip_code, country,
    latitude, longitude, course_type, green_fees_min, green_fees_max, 
    cart_fees, caddie_available, pro_shop, restaurant, driving_range, 
    putting_green, practice_facilities, lessons_available, dress_code,
    booking_policy, cancellation_policy, is_featured, is_active
) VALUES (
    'Erin Hills', 'Erin, WI', 'Championship course that hosted the 2017 U.S. Open.', 72, 18, 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop', 'https://www.erinhills.com', '(262) 670-8600', 'info@erinhills.com', '7169 County Road O', 'Erin', 'WI', '53027', 'USA', 43.2844, -88.3508, 'public', 95, 95, 20, false, true, true, true, true, true, true, 'Traditional golf attire', 'Advance booking recommended', '24-hour cancellation', true, true
);

-- Course 16: Royal County Down
INSERT INTO golf_courses (
    name, location, description, par, holes, course_image_url, logo_url, 
    website_url, phone, email, address, city, state, zip_code, country,
    latitude, longitude, course_type, green_fees_min, green_fees_max, 
    cart_fees, caddie_available, pro_shop, restaurant, driving_range, 
    putting_green, practice_facilities, lessons_available, dress_code,
    booking_policy, cancellation_policy, is_featured, is_active
) VALUES (
    'Royal County Down', 'Newcastle, Northern Ireland', 'Stunning links course with dramatic mountain and sea views.', 71, 18, 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop', 'https://www.royalcountydown.org', '+44 28 4372 3314', 'info@royalcountydown.com', '36 Golf Links Rd', 'Newcastle', 'BT33 0AN', 'Northern Ireland', 54.2181, -5.8847, 'private', 0, 0, 0, true, true, true, true, true, true, true, 'Traditional golf attire', 'Members only', 'Members only', true, true
);

-- Course 17: Carnoustie
INSERT INTO golf_courses (
    name, location, description, par, holes, course_image_url, logo_url, 
    website_url, phone, email, address, city, state, zip_code, country,
    latitude, longitude, course_type, green_fees_min, green_fees_max, 
    cart_fees, caddie_available, pro_shop, restaurant, driving_range, 
    putting_green, practice_facilities, lessons_available, dress_code,
    booking_policy, cancellation_policy, is_featured, is_active
) VALUES (
    'Carnoustie Golf Links', 'Carnoustie, Scotland', 'Challenging championship links course known for difficulty.', 72, 18, 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop', 'https://www.carnoustiegolflinks.co.uk', '+44 1241 802270', 'info@carnoustie.com', 'Links Parade', 'Carnoustie', 'DD7 7JE', 'Scotland', 56.5014, -2.7178, 'public', 195, 195, 0, false, true, true, true, true, true, true, 'Traditional golf attire', 'Advance booking recommended', '24-hour cancellation', true, true
);

-- Course 18: Royal Melbourne
INSERT INTO golf_courses (
    name, location, description, par, holes, course_image_url, logo_url, 
    website_url, phone, email, address, city, state, zip_code, country,
    latitude, longitude, course_type, green_fees_min, green_fees_max, 
    cart_fees, caddie_available, pro_shop, restaurant, driving_range, 
    putting_green, practice_facilities, lessons_available, dress_code,
    booking_policy, cancellation_policy, is_featured, is_active
) VALUES (
    'Royal Melbourne Golf Club', 'Melbourne, Australia', 'World-class sandbelt course with challenging bunkers.', 72, 18, 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop', 'https://www.royalmelbourne.com.au', '+61 3 9598 6755', 'info@royalmelbourne.com', 'Cheltenham Rd', 'Black Rock', 'VIC 3193', 'Australia', -37.9681, 145.0178, 'private', 0, 0, 0, true, true, true, true, true, true, true, 'Traditional golf attire', 'Members only', 'Members only', true, true
);

-- Course 19: Cape Kidnappers
INSERT INTO golf_courses (
    name, location, description, par, holes, course_image_url, logo_url, 
    website_url, phone, email, address, city, state, zip_code, country,
    latitude, longitude, course_type, green_fees_min, green_fees_max, 
    cart_fees, caddie_available, pro_shop, restaurant, driving_range, 
    putting_green, practice_facilities, lessons_available, dress_code,
    booking_policy, cancellation_policy, is_featured, is_active
) VALUES (
    'Cape Kidnappers', 'Hawkes Bay, New Zealand', 'Dramatic clifftop course with stunning ocean views.', 72, 18, 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop', 'https://www.capekidnappers.com', '+64 6 875 1900', 'info@capekidnappers.com', '446 Clifton Rd', 'Te Awanga', 'Hawkes Bay', 'New Zealand', -39.2844, 176.8847, 'resort', 295, 295, 25, true, true, true, true, true, true, true, 'Traditional golf attire', 'Resort guests priority', '48-hour cancellation', true, true
);

-- Course 20: Banff Springs
INSERT INTO golf_courses (
    name, location, description, par, holes, course_image_url, logo_url, 
    website_url, phone, email, address, city, state, zip_code, country,
    latitude, longitude, course_type, green_fees_min, green_fees_max, 
    cart_fees, caddie_available, pro_shop, restaurant, driving_range, 
    putting_green, practice_facilities, lessons_available, dress_code,
    booking_policy, cancellation_policy, is_featured, is_active
) VALUES (
    'Banff Springs Golf Course', 'Banff, Alberta, Canada', 'Mountain course with stunning Rocky Mountain views.', 72, 18, 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop', 'https://www.fairmont.com', '(403) 762-2211', 'info@banffsprings.com', '405 Spray Ave', 'Banff', 'AB', 'T1L 1J4', 'Canada', 51.1681, -115.5678, 'resort', 195, 195, 20, true, true, true, true, true, true, true, 'Traditional golf attire', 'Resort guests priority', '24-hour cancellation', true, true
);

-- Course 21: Shinnecock Hills
INSERT INTO golf_courses (
    name, location, description, par, holes, course_image_url, logo_url, 
    website_url, phone, email, address, city, state, zip_code, country,
    latitude, longitude, course_type, green_fees_min, green_fees_max, 
    cart_fees, caddie_available, pro_shop, restaurant, driving_range, 
    putting_green, practice_facilities, lessons_available, dress_code,
    booking_policy, cancellation_policy, is_featured, is_active
) VALUES (
    'Shinnecock Hills Golf Club', 'Southampton, NY', 'Historic course with challenging terrain on Long Island.', 70, 18, 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop', 'https://www.shinnecockhillsgolfclub.org', '(631) 283-8000', 'info@shinnecock.com', '200 Tuckahoe Rd', 'Southampton', 'NY', '11968', 'USA', 40.8844, -72.4178, 'private', 0, 0, 0, true, true, true, true, true, true, true, 'Traditional golf attire', 'Members only', 'Members only', true, true
);

-- Course 22: Merion Golf Club
INSERT INTO golf_courses (
    name, location, description, par, holes, course_image_url, logo_url, 
    website_url, phone, email, address, city, state, zip_code, country,
    latitude, longitude, course_type, green_fees_min, green_fees_max, 
    cart_fees, caddie_available, pro_shop, restaurant, driving_range, 
    putting_green, practice_facilities, lessons_available, dress_code,
    booking_policy, cancellation_policy, is_featured, is_active
) VALUES (
    'Merion Golf Club', 'Ardmore, PA', 'Historic course with challenging terrain in suburban Philadelphia.', 70, 18, 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop', 'https://www.meriongolfclub.com', '(610) 642-5600', 'info@merion.com', '450 Ardmore Ave', 'Ardmore', 'PA', '19003', 'USA', 40.0014, -75.2847, 'private', 0, 0, 0, true, true, true, true, true, true, true, 'Traditional golf attire', 'Members only', 'Members only', true, true
);

-- Course 23: Oakmont Country Club
INSERT INTO golf_courses (
    name, location, description, par, holes, course_image_url, logo_url, 
    website_url, phone, email, address, city, state, zip_code, country,
    latitude, longitude, course_type, green_fees_min, green_fees_max, 
    cart_fees, caddie_available, pro_shop, restaurant, driving_range, 
    putting_green, practice_facilities, lessons_available, dress_code,
    booking_policy, cancellation_policy, is_featured, is_active
) VALUES (
    'Oakmont Country Club', 'Oakmont, PA', 'Challenging course with fast greens and difficult rough.', 71, 18, 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop', 'https://www.oakmontcountryclub.org', '(412) 828-3000', 'info@oakmont.com', '1233 Hulton Rd', 'Oakmont', 'PA', '15139', 'USA', 40.5178, -79.8347, 'private', 0, 0, 0, true, true, true, true, true, true, true, 'Traditional golf attire', 'Members only', 'Members only', true, true
);

-- Course 24: Winged Foot Golf Club
INSERT INTO golf_courses (
    name, location, description, par, holes, course_image_url, logo_url, 
    website_url, phone, email, address, city, state, zip_code, country,
    latitude, longitude, course_type, green_fees_min, green_fees_max, 
    cart_fees, caddie_available, pro_shop, restaurant, driving_range, 
    putting_green, practice_facilities, lessons_available, dress_code,
    booking_policy, cancellation_policy, is_featured, is_active
) VALUES (
    'Winged Foot Golf Club', 'Mamaroneck, NY', 'Challenging course with difficult rough and fast greens.', 70, 18, 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop', 'https://www.wingedfootgolfclub.com', '(914) 698-0400', 'info@wingedfoot.com', '851 Fenimore Rd', 'Mamaroneck', 'NY', '10543', 'USA', 40.9508, -73.7347, 'private', 0, 0, 0, true, true, true, true, true, true, true, 'Traditional golf attire', 'Members only', 'Members only', true, true
);

-- Course 25: Seminole Golf Club
INSERT INTO golf_courses (
    name, location, description, par, holes, course_image_url, logo_url, 
    website_url, phone, email, address, city, state, zip_code, country,
    latitude, longitude, course_type, green_fees_min, green_fees_max, 
    cart_fees, caddie_available, pro_shop, restaurant, driving_range, 
    putting_green, practice_facilities, lessons_available, dress_code,
    booking_policy, cancellation_policy, is_featured, is_active
) VALUES (
    'Seminole Golf Club', 'Juno Beach, FL', 'Exclusive private club with challenging terrain on Atlantic coast.', 72, 18, 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop', 'https://www.seminolegolfclub.com', '(561) 626-3900', 'info@seminole.com', '901 Seminole Dr', 'Juno Beach', 'FL', '33408', 'USA', 26.8844, -80.0678, 'private', 0, 0, 0, true, true, true, true, true, true, true, 'Traditional golf attire', 'Members only', 'Members only', true, true
);

-- Course 26: Sand Hills Golf Club
INSERT INTO golf_courses (
    name, location, description, par, holes, course_image_url, logo_url, 
    website_url, phone, email, address, city, state, zip_code, country,
    latitude, longitude, course_type, green_fees_min, green_fees_max, 
    cart_fees, caddie_available, pro_shop, restaurant, driving_range, 
    putting_green, practice_facilities, lessons_available, dress_code,
    booking_policy, cancellation_policy, is_featured, is_active
) VALUES (
    'Sand Hills Golf Club', 'Mullen, NE', 'Modern links-style course with dramatic sand dunes.', 71, 18, 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop', 'https://www.sandhillsgolf.com', '(308) 546-2222', 'info@sandhills.com', '1 Sand Hills Dr', 'Mullen', 'NE', '69152', 'USA', 42.0514, -101.1178, 'private', 0, 0, 0, true, true, true, true, true, true, true, 'Traditional golf attire', 'Members only', 'Members only', true, true
);

-- Course 27: Pacific Dunes
INSERT INTO golf_courses (
    name, location, description, par, holes, course_image_url, logo_url, 
    website_url, phone, email, address, city, state, zip_code, country,
    latitude, longitude, course_type, green_fees_min, green_fees_max, 
    cart_fees, caddie_available, pro_shop, restaurant, driving_range, 
    putting_green, practice_facilities, lessons_available, dress_code,
    booking_policy, cancellation_policy, is_featured, is_active
) VALUES (
    'Pacific Dunes', 'Bandon, OR', 'Authentic links course with dramatic ocean views.', 71, 18, 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop', 'https://www.bandondunesgolf.com', '(541) 347-4380', 'info@bandondunes.com', '57744 Round Lake Rd', 'Bandon', 'OR', '97411', 'USA', 43.1181, -124.4081, 'resort', 295, 295, 25, true, true, true, true, true, true, true, 'Traditional golf attire', 'Advance booking required', '48-hour cancellation', true, true
);

-- Course 28: Bandon Trails
INSERT INTO golf_courses (
    name, location, description, par, holes, course_image_url, logo_url, 
    website_url, phone, email, address, city, state, zip_code, country,
    latitude, longitude, course_type, green_fees_min, green_fees_max, 
    cart_fees, caddie_available, pro_shop, restaurant, driving_range, 
    putting_green, practice_facilities, lessons_available, dress_code,
    booking_policy, cancellation_policy, is_featured, is_active
) VALUES (
    'Bandon Trails', 'Bandon, OR', 'Inland course with dramatic elevation changes through forests.', 71, 18, 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop', 'https://www.bandondunesgolf.com', '(541) 347-4380', 'info@bandondunes.com', '57744 Round Lake Rd', 'Bandon', 'OR', '97411', 'USA', 43.1181, -124.4081, 'resort', 295, 295, 25, true, true, true, true, true, true, true, 'Traditional golf attire', 'Advance booking required', '48-hour cancellation', true, true
);

-- Course 29: Old Macdonald
INSERT INTO golf_courses (
    name, location, description, par, holes, course_image_url, logo_url, 
    website_url, phone, email, address, city, state, zip_code, country,
    latitude, longitude, course_type, green_fees_min, green_fees_max, 
    cart_fees, caddie_available, pro_shop, restaurant, driving_range, 
    putting_green, practice_facilities, lessons_available, dress_code,
    booking_policy, cancellation_policy, is_featured, is_active
) VALUES (
    'Old Macdonald', 'Bandon, OR', 'Tribute to classic golf architecture with challenging holes.', 72, 18, 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop', 'https://www.bandondunesgolf.com', '(541) 347-4380', 'info@bandondunes.com', '57744 Round Lake Rd', 'Bandon', 'OR', '97411', 'USA', 43.1181, -124.4081, 'resort', 295, 295, 25, true, true, true, true, true, true, true, 'Traditional golf attire', 'Advance booking required', '48-hour cancellation', true, true
);

-- Course 30: Bandon Preserve
INSERT INTO golf_courses (
    name, location, description, par, holes, course_image_url, logo_url, 
    website_url, phone, email, address, city, state, zip_code, country,
    latitude, longitude, course_type, green_fees_min, green_fees_max, 
    cart_fees, caddie_available, pro_shop, restaurant, driving_range, 
    putting_green, practice_facilities, lessons_available, dress_code,
    booking_policy, cancellation_policy, is_featured, is_active
) VALUES (
    'Bandon Preserve', 'Bandon, OR', '13-hole par-3 course with dramatic ocean views.', 39, 13, 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop', 'https://www.bandondunesgolf.com', '(541) 347-4380', 'info@bandondunes.com', '57744 Round Lake Rd', 'Bandon', 'OR', '97411', 'USA', 43.1181, -124.4081, 'resort', 95, 95, 15, true, true, true, true, true, true, true, 'Traditional golf attire', 'Advance booking required', '48-hour cancellation', true, true
);

-- Verify the data was inserted
SELECT 'Batch 2 completed successfully!' AS status, COUNT(*) AS total_courses FROM golf_courses;
