-- Test Single Course Insert
-- Run this to test the structure

-- Test with just one course to verify the structure
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

-- Verify the data was inserted
SELECT 'Test course inserted successfully!' AS status, COUNT(*) AS total_courses FROM golf_courses;
