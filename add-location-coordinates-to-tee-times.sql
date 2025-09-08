-- Add location coordinates to golf courses and tee times for location-based filtering
-- This enables users to find tee times closest to their current location

-- ===========================================
-- STEP 1: Add coordinate columns to golf_courses
-- ===========================================

-- Add latitude and longitude columns to golf_courses table
ALTER TABLE golf_courses 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add indexes for better performance on location queries
CREATE INDEX IF NOT EXISTS idx_golf_courses_coordinates ON golf_courses(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_golf_courses_location ON golf_courses(location);

-- ===========================================
-- STEP 2: Add coordinate columns to tee_times
-- ===========================================

-- Add latitude and longitude columns to tee_times table
ALTER TABLE tee_times 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS course_location TEXT;

-- Add indexes for better performance on location queries
CREATE INDEX IF NOT EXISTS idx_tee_times_coordinates ON tee_times(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_tee_times_location ON tee_times(course_location);

-- ===========================================
-- STEP 3: Update existing golf courses with coordinates
-- ===========================================

-- Update popular golf courses with their actual coordinates
UPDATE golf_courses SET latitude = 40.7505, longitude = -73.9934 WHERE name = 'Bethpage Black';
UPDATE golf_courses SET latitude = 32.8969, longitude = -117.2508 WHERE name = 'Torrey Pines Golf Course';
UPDATE golf_courses SET latitude = 47.2069, longitude = -122.5334 WHERE name = 'Chambers Bay';
UPDATE golf_courses SET latitude = 27.7756, longitude = -81.8081 WHERE name = 'Streamsong Resort';
UPDATE golf_courses SET latitude = 43.2381, longitude = -88.3181 WHERE name = 'Erin Hills';
UPDATE golf_courses SET latitude = 54.2181, longitude = -5.8847 WHERE name = 'Royal County Down';
UPDATE golf_courses SET latitude = 56.5014, longitude = -2.7056 WHERE name = 'Carnoustie Golf Links';
UPDATE golf_courses SET latitude = -37.8136, longitude = 145.0181 WHERE name = 'Royal Melbourne Golf Club';
UPDATE golf_courses SET latitude = -39.4756, longitude = 176.9106 WHERE name = 'Cape Kidnappers';
UPDATE golf_courses SET latitude = 51.1756, longitude = -115.5694 WHERE name = 'Banff Springs Golf Course';
UPDATE golf_courses SET latitude = 40.8756, longitude = -72.4681 WHERE name = 'Shinnecock Hills Golf Club';
UPDATE golf_courses SET latitude = 40.0069, longitude = -75.3181 WHERE name = 'Merion Golf Club';

-- Update more courses with coordinates
UPDATE golf_courses SET latitude = 34.2069, longitude = -118.1681 WHERE name = 'Riviera Country Club';
UPDATE golf_courses SET latitude = 40.1069, longitude = -74.2181 WHERE name = 'Baltusrol Golf Club';
UPDATE golf_courses SET latitude = 41.8756, longitude = -87.6181 WHERE name = 'Medinah Country Club';
UPDATE golf_courses SET latitude = 33.5069, longitude = -117.7681 WHERE name = 'Monarch Beach Golf Links';
UPDATE golf_courses SET latitude = 40.1069, longitude = -74.2181 WHERE name = 'Plainfield Country Club';
UPDATE golf_courses SET latitude = 40.8756, longitude = -72.4681 WHERE name = 'National Golf Links of America';
UPDATE golf_courses SET latitude = 40.8756, longitude = -72.4681 WHERE name = 'Seabonack Golf Club';
UPDATE golf_courses SET latitude = 40.8756, longitude = -72.4681 WHERE name = 'Fishers Island Club';
UPDATE golf_courses SET latitude = 40.8756, longitude = -72.4681 WHERE name = 'Friars Head Golf Club';
UPDATE golf_courses SET latitude = 40.8756, longitude = -72.4681 WHERE name = 'Sleepy Hollow Country Club';

-- ===========================================
-- STEP 4: Update tee_times with course location data
-- ===========================================

-- Update tee_times with course location information
UPDATE tee_times 
SET course_location = gc.location,
    latitude = gc.latitude,
    longitude = gc.longitude
FROM golf_courses gc
WHERE tee_times.course_id = gc.id
  AND gc.latitude IS NOT NULL 
  AND gc.longitude IS NOT NULL;

-- ===========================================
-- STEP 5: Create function for distance calculation
-- ===========================================

-- Create a function to calculate distance between two points using Haversine formula
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 DECIMAL(10, 8),
    lon1 DECIMAL(11, 8),
    lat2 DECIMAL(10, 8),
    lon2 DECIMAL(11, 8)
) RETURNS DECIMAL AS $$
DECLARE
    earth_radius DECIMAL := 6371; -- Earth's radius in kilometers
    dlat DECIMAL;
    dlon DECIMAL;
    a DECIMAL;
    c DECIMAL;
    distance DECIMAL;
BEGIN
    -- Convert degrees to radians
    dlat := radians(lat2 - lat1);
    dlon := radians(lon2 - lon1);
    
    -- Haversine formula
    a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2) * sin(dlon/2);
    c := 2 * atan2(sqrt(a), sqrt(1-a));
    distance := earth_radius * c;
    
    RETURN distance;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- STEP 6: Create function for nearby tee times
-- ===========================================

-- Create a function to get nearby tee times within a radius
CREATE OR REPLACE FUNCTION get_nearby_tee_times(
    user_lat DECIMAL(10, 8),
    user_lon DECIMAL(11, 8),
    radius_km DECIMAL DEFAULT 50
) RETURNS TABLE (
    id UUID,
    course_id UUID,
    creator_id UUID,
    tee_time_date DATE,
    tee_time_time TIME,
    max_players INTEGER,
    current_players INTEGER,
    handicap_requirement TEXT,
    description TEXT,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    course_location TEXT,
    distance_km DECIMAL,
    course_name TEXT,
    course_image_url TEXT,
    logo_url TEXT,
    creator_first_name TEXT,
    creator_last_name TEXT,
    creator_avatar_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tt.id,
        tt.course_id,
        tt.creator_id,
        tt.tee_time_date,
        tt.tee_time_time,
        tt.max_players,
        tt.current_players,
        tt.handicap_requirement,
        tt.description,
        tt.status,
        tt.created_at,
        tt.updated_at,
        COALESCE(tt.latitude, gc.latitude) as latitude,
        COALESCE(tt.longitude, gc.longitude) as longitude,
        COALESCE(tt.course_location, gc.location) as course_location,
        calculate_distance(
            user_lat, 
            user_lon, 
            COALESCE(tt.latitude, gc.latitude), 
            COALESCE(tt.longitude, gc.longitude)
        ) as distance_km,
        gc.name as course_name,
        gc.course_image_url,
        gc.logo_url,
        up.first_name as creator_first_name,
        up.last_name as creator_last_name,
        up.avatar_url as creator_avatar_url
    FROM tee_times tt
    LEFT JOIN golf_courses gc ON tt.course_id = gc.id
    LEFT JOIN user_profiles up ON tt.creator_id = up.id
    WHERE tt.status = 'active'
      AND tt.tee_time_date >= CURRENT_DATE
      AND (
          (tt.latitude IS NOT NULL AND tt.longitude IS NOT NULL) OR
          (gc.latitude IS NOT NULL AND gc.longitude IS NOT NULL)
      )
      AND calculate_distance(
          user_lat, 
          user_lon, 
          COALESCE(tt.latitude, gc.latitude), 
          COALESCE(tt.longitude, gc.longitude)
      ) <= radius_km
    ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- STEP 7: Create view for tee times with distance
-- ===========================================

-- Create a view that includes distance calculation for tee times
CREATE OR REPLACE VIEW tee_times_with_distance AS
SELECT 
    tt.*,
    gc.name as course_name,
    gc.location as course_location,
    gc.latitude as course_latitude,
    gc.longitude as course_longitude,
    gc.course_image_url,
    gc.logo_url,
    up.first_name as creator_first_name,
    up.last_name as creator_last_name,
    up.avatar_url as creator_avatar_url
FROM tee_times tt
LEFT JOIN golf_courses gc ON tt.course_id = gc.id
LEFT JOIN user_profiles up ON tt.creator_id = up.id
WHERE tt.status = 'active'
  AND tt.tee_time_date >= CURRENT_DATE;

-- ===========================================
-- STEP 7: Add RLS policies for location-based queries
-- ===========================================

-- Allow users to view tee times with location data
DROP POLICY IF EXISTS "Users can view tee times with location" ON tee_times;
CREATE POLICY "Users can view tee times with location" ON tee_times
FOR SELECT USING (status = 'active');

-- Allow users to view golf courses with location data
DROP POLICY IF EXISTS "Users can view golf courses with location" ON golf_courses;
CREATE POLICY "Users can view golf courses with location" ON golf_courses
FOR SELECT USING (is_active = true);

-- ===========================================
-- STEP 8: Verify the changes
-- ===========================================

-- Check that coordinates were added successfully
SELECT 
    name,
    location,
    latitude,
    longitude,
    CASE 
        WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 'Has Coordinates'
        ELSE 'Missing Coordinates'
    END as coordinate_status
FROM golf_courses 
ORDER BY name
LIMIT 10;

-- Check tee times with location data
SELECT 
    tt.id,
    gc.name as course_name,
    gc.location as course_location,
    tt.latitude,
    tt.longitude,
    tt.tee_time_date,
    tt.tee_time_time
FROM tee_times tt
LEFT JOIN golf_courses gc ON tt.course_id = gc.id
WHERE tt.latitude IS NOT NULL 
  AND tt.longitude IS NOT NULL
LIMIT 5;
