-- Ultimate Golf Community - Production Database Setup (FIXED)
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE connection_status AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE application_status AS ENUM ('pending', 'approved', 'denied', 'withdrawn');
CREATE TYPE notification_type AS ENUM ('tee_time_application', 'group_invite', 'connection_request', 'tee_time_reminder', 'group_message', 'badge_earned', 'achievement_unlocked');
CREATE TYPE group_role AS ENUM ('owner', 'admin', 'member');
CREATE TYPE badge_category AS ENUM ('early_adopter', 'achievement', 'milestone', 'special');

-- Badges Table
CREATE TABLE IF NOT EXISTS badges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    icon_name TEXT NOT NULL,
    category badge_category NOT NULL,
    criteria TEXT,
    points INTEGER DEFAULT 0,
    rarity TEXT DEFAULT 'common',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Badges Table (junction table)
CREATE TABLE IF NOT EXISTS user_badges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    earned_reason TEXT,
    UNIQUE(user_id, badge_id)
);

-- User Achievements Table
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    achievement_type TEXT NOT NULL,
    achievement_value INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_type)
);

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    full_name TEXT,
    email TEXT,
    username TEXT UNIQUE,
    avatar_url TEXT,
    bio TEXT,
    handicap INTEGER CHECK (handicap >= 0 AND handicap <= 54),
    home_course TEXT,
    location TEXT,
    total_points INTEGER DEFAULT 0,
    member_since TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Golf Courses Table
CREATE TABLE IF NOT EXISTS golf_courses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT,
    description TEXT,
    par INTEGER,
    holes INTEGER DEFAULT 18,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tee Times Table
CREATE TABLE IF NOT EXISTS tee_times (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_name TEXT NOT NULL,
    tee_time_date DATE NOT NULL,
    tee_time_time TIME NOT NULL,
    max_players INTEGER NOT NULL CHECK (max_players > 0 AND max_players <= 8),
    current_players INTEGER DEFAULT 1 CHECK (current_players > 0 AND current_players <= max_players),
    available_spots INTEGER GENERATED ALWAYS AS (max_players - current_players) STORED,
    handicap_requirement TEXT DEFAULT 'Any level',
    description TEXT,
    creator_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Golf Groups Table
CREATE TABLE IF NOT EXISTS golf_groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    creator_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    max_members INTEGER DEFAULT 20,
    is_private BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Group Members Table
CREATE TABLE IF NOT EXISTS group_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id UUID REFERENCES golf_groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    role group_role DEFAULT 'member',
    status TEXT DEFAULT 'active',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- Tee Time Applications Table
CREATE TABLE IF NOT EXISTS tee_time_applications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tee_time_id UUID REFERENCES tee_times(id) ON DELETE CASCADE,
    applicant_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    status application_status DEFAULT 'pending',
    message TEXT,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tee_time_id, applicant_id)
);

-- Group Messages Table
CREATE TABLE IF NOT EXISTS group_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id UUID REFERENCES golf_groups(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    message_content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Connections Table
CREATE TABLE IF NOT EXISTS user_connections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    requester_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    status connection_status DEFAULT 'pending',
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(requester_id, recipient_id)
);

-- Direct Messages Table
CREATE TABLE IF NOT EXISTS direct_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    message_content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Course Reviews Table
CREATE TABLE IF NOT EXISTS course_reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id UUID REFERENCES golf_courses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(course_id, user_id)
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_id UUID,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Golf Rounds Table (for tracking achievements)
CREATE TABLE IF NOT EXISTS golf_rounds (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    course_id UUID REFERENCES golf_courses(id),
    course_name TEXT NOT NULL,
    date_played DATE NOT NULL,
    total_score INTEGER,
    par INTEGER,
    holes_played INTEGER DEFAULT 18,
    weather_conditions TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Golf Round Details Table (for hole-by-hole tracking)
CREATE TABLE IF NOT EXISTS golf_round_details (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    round_id UUID REFERENCES golf_rounds(id) ON DELETE CASCADE,
    hole_number INTEGER NOT NULL,
    par INTEGER NOT NULL,
    score INTEGER NOT NULL,
    putts INTEGER,
    fairway_hit BOOLEAN,
    green_in_regulation BOOLEAN,
    sand_saves INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_tee_times_date ON tee_times(tee_time_date);
CREATE INDEX IF NOT EXISTS idx_tee_times_creator ON tee_times(creator_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_requester ON user_connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_recipient ON user_connections(recipient_id);
CREATE INDEX IF NOT EXISTS idx_course_reviews_course ON course_reviews(course_id);
CREATE INDEX IF NOT EXISTS idx_course_reviews_user ON course_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_golf_rounds_user ON golf_rounds(user_id);
CREATE INDEX IF NOT EXISTS idx_golf_rounds_date ON golf_rounds(date_played);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tee_times_updated_at BEFORE UPDATE ON tee_times FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_golf_groups_updated_at BEFORE UPDATE ON golf_groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tee_time_applications_updated_at BEFORE UPDATE ON tee_time_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_connections_updated_at BEFORE UPDATE ON user_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_course_reviews_updated_at BEFORE UPDATE ON course_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create notification function
CREATE OR REPLACE FUNCTION create_notification(
    user_id_param UUID,
    type_param notification_type,
    title_param TEXT,
    message_param TEXT,
    related_id_param UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO notifications (user_id, type, title, message, related_id)
    VALUES (user_id_param, type_param, title_param, message_param, related_id_param);
END;
$$ LANGUAGE plpgsql;

-- Create badge earning function
CREATE OR REPLACE FUNCTION award_badge(
    user_id_param UUID,
    badge_name_param TEXT,
    reason_param TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    badge_record RECORD;
    existing_badge RECORD;
BEGIN
    -- Get badge details
    SELECT * INTO badge_record FROM badges WHERE name = badge_name_param;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check if user already has this badge
    SELECT * INTO existing_badge FROM user_badges WHERE user_id = user_id_param AND badge_id = badge_record.id;
    
    IF FOUND THEN
        RETURN FALSE; -- Already has badge
    END IF;
    
    -- Award the badge
    INSERT INTO user_badges (user_id, badge_id, earned_reason)
    VALUES (user_id_param, badge_record.id, reason_param);
    
    -- Update user points
    UPDATE user_profiles 
    SET total_points = total_points + badge_record.points
    WHERE id = user_id_param;
    
    -- Create notification
    PERFORM create_notification(
        user_id_param,
        'badge_earned',
        'New Badge Earned!',
        'Congratulations! You earned the ' || badge_record.name || ' badge!',
        badge_record.id
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create achievement tracking function
CREATE OR REPLACE FUNCTION update_achievement(
    user_id_param UUID,
    achievement_type_param TEXT,
    value_param INTEGER
)
RETURNS VOID AS $$
DECLARE
    current_value INTEGER;
    new_value INTEGER;
BEGIN
    -- Get current achievement value
    SELECT achievement_value INTO current_value 
    FROM user_achievements 
    WHERE user_id = user_id_param AND achievement_type = achievement_type_param;
    
    IF NOT FOUND THEN
        -- Create new achievement record
        INSERT INTO user_achievements (user_id, achievement_type, achievement_value)
        VALUES (user_id_param, achievement_type_param, value_param);
        new_value := value_param;
    ELSE
        -- Update existing achievement
        UPDATE user_achievements 
        SET achievement_value = value_param, last_updated = NOW()
        WHERE user_id = user_id_param AND achievement_type = achievement_type_param;
        new_value := value_param;
    END IF;
    
    -- Check for milestone badges based on achievement type
    IF achievement_type_param = 'rounds_played' THEN
        IF new_value >= 1 AND current_value < 1 THEN
            PERFORM award_badge(user_id_param, 'First Round', 'Completed your first round of golf');
        END IF;
        IF new_value >= 10 AND current_value < 10 THEN
            PERFORM award_badge(user_id_param, 'Regular Golfer', 'Played 10 rounds of golf');
        END IF;
        IF new_value >= 50 AND current_value < 50 THEN
            PERFORM award_badge(user_id_param, 'Golf Enthusiast', 'Played 50 rounds of golf');
        END IF;
        IF new_value >= 100 AND current_value < 100 THEN
            PERFORM award_badge(user_id_param, 'Golf Master', 'Played 100 rounds of golf');
        END IF;
    END IF;
    
    IF achievement_type_param = 'hole_in_one' THEN
        IF new_value >= 1 AND current_value < 1 THEN
            PERFORM award_badge(user_id_param, 'Hole in One!', 'Achieved the ultimate golf milestone');
        END IF;
        IF new_value >= 3 AND current_value < 3 THEN
            PERFORM award_badge(user_id_param, 'Hole in One Pro', 'Multiple holes in one!');
        END IF;
    END IF;
    
    IF achievement_type_param = 'eagles' THEN
        IF new_value >= 1 AND current_value < 1 THEN
            PERFORM award_badge(user_id_param, 'Eagle Eye', 'Scored your first eagle');
        END IF;
        IF new_value >= 5 AND current_value < 5 THEN
            PERFORM award_badge(user_id_param, 'Eagle Hunter', 'Multiple eagles under your belt');
        END IF;
    END IF;
    
    IF achievement_type_param = 'birdies' THEN
        IF new_value >= 10 AND current_value < 10 THEN
            PERFORM award_badge(user_id_param, 'Birdie Machine', '10 birdies and counting');
        END IF;
        IF new_value >= 50 AND current_value < 50 THEN
            PERFORM award_badge(user_id_param, 'Birdie Master', '50 birdies achieved');
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create helper functions
CREATE OR REPLACE FUNCTION get_user_groups(user_id_param UUID)
RETURNS TABLE(group_id UUID, group_name TEXT, role group_role) AS $$
BEGIN
    RETURN QUERY
    SELECT gm.group_id, gg.name, gm.role
    FROM group_members gm
    JOIN golf_groups gg ON gm.group_id = gg.id
    WHERE gm.user_id = user_id_param AND gm.status = 'active';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_tee_time_applications(tee_time_id_param UUID)
RETURNS TABLE(applicant_id UUID, applicant_name TEXT, status application_status, message TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT tta.applicant_id, up.first_name || ' ' || up.last_name, tta.status, tta.message
    FROM tee_time_applications tta
    JOIN user_profiles up ON tta.applicant_id = up.id
    WHERE tta.tee_time_id = tee_time_id_param;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE golf_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tee_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE golf_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tee_time_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE golf_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE golf_round_details ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view all profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for tee_times
CREATE POLICY "Anyone can view active tee times" ON tee_times FOR SELECT USING (status = 'active');
CREATE POLICY "Users can create tee times" ON tee_times FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Users can update own tee times" ON tee_times FOR UPDATE USING (auth.uid() = creator_id);

-- RLS Policies for golf_groups
CREATE POLICY "Anyone can view public groups" ON golf_groups FOR SELECT USING (NOT is_private);
CREATE POLICY "Group members can view private groups" ON golf_groups FOR SELECT USING (
    EXISTS (SELECT 1 FROM group_members WHERE group_id = id AND user_id = auth.uid())
);
CREATE POLICY "Users can create groups" ON golf_groups FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- RLS Policies for group_members
CREATE POLICY "Group members can view members" ON group_members FOR SELECT USING (
    EXISTS (SELECT 1 FROM group_members WHERE group_id = group_id AND user_id = auth.uid())
);
CREATE POLICY "Group admins can manage members" ON group_members FOR ALL USING (
    EXISTS (SELECT 1 FROM group_members WHERE group_id = group_id AND user_id = auth.uid() AND role IN ('owner', 'admin'))
);

-- RLS Policies for user_connections
CREATE POLICY "Users can view own connections" ON user_connections FOR SELECT USING (
    auth.uid() = requester_id OR auth.uid() = recipient_id
);
CREATE POLICY "Users can create connection requests" ON user_connections FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users can update own connections" ON user_connections FOR UPDATE USING (
    auth.uid() = requester_id OR auth.uid() = recipient_id
);

-- RLS Policies for direct_messages
CREATE POLICY "Users can view messages they sent or received" ON direct_messages FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = recipient_id
);
CREATE POLICY "Users can send messages" ON direct_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- RLS Policies for course_reviews
CREATE POLICY "Anyone can view course reviews" ON course_reviews FOR SELECT USING (true);
CREATE POLICY "Users can create course reviews" ON course_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own course reviews" ON course_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own course reviews" ON course_reviews FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for badges
CREATE POLICY "Anyone can view badges" ON badges FOR SELECT USING (true);

-- RLS Policies for user_badges
CREATE POLICY "Users can view all user badges" ON user_badges FOR SELECT USING (true);
CREATE POLICY "Users can view own badges" ON user_badges FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view all achievements" ON user_achievements FOR SELECT USING (true);
CREATE POLICY "Users can view own achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for golf_rounds
CREATE POLICY "Users can view own rounds" ON golf_rounds FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own rounds" ON golf_rounds FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rounds" ON golf_rounds FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for golf_round_details
CREATE POLICY "Users can view own round details" ON golf_round_details FOR SELECT USING (
    EXISTS (SELECT 1 FROM golf_rounds WHERE id = round_id AND user_id = auth.uid())
);
CREATE POLICY "Users can create own round details" ON golf_round_details FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM golf_rounds WHERE id = round_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update own round details" ON golf_round_details FOR UPDATE USING (
    EXISTS (SELECT 1 FROM golf_rounds WHERE id = round_id AND user_id = auth.uid())
);

-- Insert sample golf courses
INSERT INTO golf_courses (name, location, description, par, holes) VALUES
('Pebble Beach Golf Links', 'Pebble Beach, CA', 'Iconic coastal golf course with stunning ocean views', 72, 18),
('Augusta National Golf Club', 'Augusta, GA', 'Home of The Masters Tournament', 72, 18),
('St. Andrews Old Course', 'St. Andrews, Scotland', 'The oldest and most iconic golf course in the world', 72, 18),
('Pinehurst No. 2', 'Pinehurst, NC', 'Historic course known for its crowned, undulating greens', 72, 18),
('Whistling Straits', 'Kohler, WI', 'Links-style course along Lake Michigan', 72, 18);

-- Insert badges
INSERT INTO badges (name, description, icon_name, category, criteria, points, rarity) VALUES
-- Early Adopter Badges
('Founding Member', 'One of the first 20 members of Ultimate Golf Community', 'crown', 'early_adopter', 'First 20 signups', 100, 'legendary'),
('Early Bird', 'Joined in the first week of launch', 'sunrise', 'early_adopter', 'First week signup', 50, 'rare'),

-- Achievement Badges
('First Round', 'Completed your first round of golf', 'flag', 'achievement', 'Play 1 round', 10, 'common'),
('Regular Golfer', 'Played 10 rounds of golf', 'golf', 'achievement', 'Play 10 rounds', 25, 'uncommon'),
('Golf Enthusiast', 'Played 50 rounds of golf', 'trophy', 'achievement', 'Play 50 rounds', 50, 'rare'),
('Golf Master', 'Played 100 rounds of golf', 'medal', 'achievement', 'Play 100 rounds', 100, 'epic'),

-- Hole in One Badges
('Hole in One!', 'Achieved the ultimate golf milestone', 'star', 'achievement', 'Score a hole in one', 200, 'legendary'),
('Hole in One Pro', 'Multiple holes in one!', 'crown', 'achievement', 'Score 3 holes in one', 500, 'mythic'),

-- Scoring Badges
('Eagle Eye', 'Scored your first eagle', 'zap', 'achievement', 'Score an eagle', 75, 'rare'),
('Eagle Hunter', 'Multiple eagles under your belt', 'lightning', 'achievement', 'Score 5 eagles', 150, 'epic'),
('Birdie Machine', '10 birdies and counting', 'target', 'achievement', 'Score 10 birdies', 30, 'uncommon'),
('Birdie Master', '50 birdies achieved', 'award', 'achievement', 'Score 50 birdies', 100, 'epic'),

-- Social Badges
('Social Butterfly', 'Connected with 10 other golfers', 'users', 'achievement', 'Make 10 connections', 25, 'uncommon'),
('Community Leader', 'Created and managed a golf group', 'shield', 'achievement', 'Create a group', 50, 'rare'),
('Reviewer', 'Reviewed your first golf course', 'edit', 'achievement', 'Write a course review', 15, 'common'),
('Course Explorer', 'Played at 5 different courses', 'map', 'achievement', 'Play at 5 courses', 40, 'uncommon'),

-- Milestone Badges
('Weekend Warrior', 'Played golf for 4 consecutive weekends', 'calendar', 'milestone', '4 consecutive weekends', 35, 'uncommon'),
('Weather Warrior', 'Played in challenging weather conditions', 'cloud-rain', 'milestone', 'Play in bad weather', 45, 'rare'),
('Early Riser', 'Played a round before 8 AM', 'sun', 'milestone', 'Early morning round', 20, 'common');

-- Create trigger to automatically create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_count INTEGER;
BEGIN
    -- Get current user count
    SELECT COUNT(*) INTO user_count FROM user_profiles;
    
    -- Create user profile
    INSERT INTO user_profiles (id, email, username, first_name, last_name, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name',
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'first_name' || ' ' || NEW.raw_user_meta_data->>'last_name')
    );
    
    -- Award early adopter badges
    IF user_count < 20 THEN
        PERFORM award_badge(NEW.id, 'Founding Member', 'One of the first 20 members!');
    END IF;
    
    IF user_count < 100 THEN
        PERFORM award_badge(NEW.id, 'Early Bird', 'Joined in the first week!');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
