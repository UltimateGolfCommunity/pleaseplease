-- Enhanced Golf Courses Schema with Image Support
-- Run this in your Supabase SQL Editor

-- Add image fields to golf_courses table
ALTER TABLE golf_courses 
ADD COLUMN IF NOT EXISTS course_image_url TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'USA',
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS course_type TEXT DEFAULT 'public', -- public, private, resort, municipal
ADD COLUMN IF NOT EXISTS green_fees_min INTEGER,
ADD COLUMN IF NOT EXISTS green_fees_max INTEGER,
ADD COLUMN IF NOT EXISTS cart_fees INTEGER,
ADD COLUMN IF NOT EXISTS caddie_available BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS pro_shop BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS restaurant BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS driving_range BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS putting_green BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS practice_facilities BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS lessons_available BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS dress_code TEXT,
ADD COLUMN IF NOT EXISTS booking_policy TEXT,
ADD COLUMN IF NOT EXISTS cancellation_policy TEXT,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES user_profiles(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES user_profiles(id);

-- Create course amenities table for detailed amenities
CREATE TABLE IF NOT EXISTS course_amenities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id UUID REFERENCES golf_courses(id) ON DELETE CASCADE,
    amenity_type TEXT NOT NULL, -- 'facility', 'service', 'equipment'
    amenity_name TEXT NOT NULL,
    description TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    additional_cost INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create course photos table for multiple images
CREATE TABLE IF NOT EXISTS course_photos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id UUID REFERENCES golf_courses(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    photo_type TEXT DEFAULT 'general', -- 'general', 'hole', 'facility', 'aerial'
    caption TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    uploaded_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create course holes table for detailed hole information
CREATE TABLE IF NOT EXISTS course_holes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id UUID REFERENCES golf_courses(id) ON DELETE CASCADE,
    hole_number INTEGER NOT NULL,
    par INTEGER NOT NULL,
    yardage INTEGER NOT NULL,
    handicap INTEGER,
    description TEXT,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(course_id, hole_number)
);

-- Create course tee times table for booking management
CREATE TABLE IF NOT EXISTS course_tee_times (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id UUID REFERENCES golf_courses(id) ON DELETE CASCADE,
    tee_time_date DATE NOT NULL,
    tee_time_time TIME NOT NULL,
    available_spots INTEGER NOT NULL,
    price_per_person INTEGER NOT NULL,
    is_booked BOOLEAN DEFAULT FALSE,
    booking_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(course_id, tee_time_date, tee_time_time)
);

-- Create course management table for admin functions
CREATE TABLE IF NOT EXISTS course_management (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id UUID REFERENCES golf_courses(id) ON DELETE CASCADE,
    manager_id UUID REFERENCES user_profiles(id),
    role TEXT DEFAULT 'manager', -- 'owner', 'manager', 'staff'
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_golf_courses_city_state ON golf_courses(city, state);
CREATE INDEX IF NOT EXISTS idx_golf_courses_course_type ON golf_courses(course_type);
CREATE INDEX IF NOT EXISTS idx_golf_courses_is_featured ON golf_courses(is_featured);
CREATE INDEX IF NOT EXISTS idx_golf_courses_is_active ON golf_courses(is_active);
CREATE INDEX IF NOT EXISTS idx_course_amenities_course ON course_amenities(course_id);
CREATE INDEX IF NOT EXISTS idx_course_photos_course ON course_photos(course_id);
CREATE INDEX IF NOT EXISTS idx_course_holes_course ON course_holes(course_id);
CREATE INDEX IF NOT EXISTS idx_course_tee_times_course ON course_tee_times(course_id);
CREATE INDEX IF NOT EXISTS idx_course_management_course ON course_management(course_id);

-- Enable RLS on new tables
ALTER TABLE course_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_holes ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_tee_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_management ENABLE ROW LEVEL SECURITY;

-- RLS Policies for course_amenities
CREATE POLICY "Anyone can view course amenities" ON course_amenities FOR SELECT USING (true);
CREATE POLICY "Course managers can manage amenities" ON course_amenities FOR ALL USING (
    EXISTS (
        SELECT 1 FROM course_management 
        WHERE course_id = course_amenities.course_id 
        AND manager_id = auth.uid() 
        AND is_active = true
    )
);

-- RLS Policies for course_photos
CREATE POLICY "Anyone can view course photos" ON course_photos FOR SELECT USING (true);
CREATE POLICY "Course managers can manage photos" ON course_photos FOR ALL USING (
    EXISTS (
        SELECT 1 FROM course_management 
        WHERE course_id = course_photos.course_id 
        AND manager_id = auth.uid() 
        AND is_active = true
    )
);

-- RLS Policies for course_holes
CREATE POLICY "Anyone can view course holes" ON course_holes FOR SELECT USING (true);
CREATE POLICY "Course managers can manage holes" ON course_holes FOR ALL USING (
    EXISTS (
        SELECT 1 FROM course_management 
        WHERE course_id = course_holes.course_id 
        AND manager_id = auth.uid() 
        AND is_active = true
    )
);

-- RLS Policies for course_tee_times
CREATE POLICY "Anyone can view tee times" ON course_tee_times FOR SELECT USING (true);
CREATE POLICY "Course managers can manage tee times" ON course_tee_times FOR ALL USING (
    EXISTS (
        SELECT 1 FROM course_management 
        WHERE course_id = course_tee_times.course_id 
        AND manager_id = auth.uid() 
        AND is_active = true
    )
);

-- RLS Policies for course_management
CREATE POLICY "Users can view course management" ON course_management FOR SELECT USING (true);
CREATE POLICY "Course owners can manage staff" ON course_management FOR ALL USING (
    EXISTS (
        SELECT 1 FROM course_management 
        WHERE course_id = course_management.course_id 
        AND manager_id = auth.uid() 
        AND role = 'owner'
        AND is_active = true
    )
);

-- Update existing golf_courses RLS policies
CREATE POLICY "Anyone can view active courses" ON golf_courses FOR SELECT USING (is_active = true);
CREATE POLICY "Course managers can update courses" ON golf_courses FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM course_management 
        WHERE course_id = golf_courses.id 
        AND manager_id = auth.uid() 
        AND is_active = true
    )
);

-- Add comments
COMMENT ON TABLE course_amenities IS 'Detailed amenities and facilities for each golf course';
COMMENT ON TABLE course_photos IS 'Multiple photos for each golf course';
COMMENT ON TABLE course_holes IS 'Individual hole information for each golf course';
COMMENT ON TABLE course_tee_times IS 'Available tee times for booking';
COMMENT ON TABLE course_management IS 'Course management roles and permissions';

-- Verify the enhanced schema
SELECT 'Enhanced golf courses schema created successfully' AS status;
