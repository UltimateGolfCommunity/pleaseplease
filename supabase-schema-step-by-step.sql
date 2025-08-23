-- Supabase Database Schema - Step by Step
-- Run each section separately in Supabase SQL Editor

-- ===========================================
-- STEP 1: Create Custom Types
-- ===========================================
CREATE TYPE badge_rarity AS ENUM ('common', 'uncommon', 'rare', 'epic', 'legendary');
CREATE TYPE badge_category AS ENUM ('achievement', 'milestone', 'early_adopter', 'special');

-- ===========================================
-- STEP 2: Create Base Tables (No Dependencies)
-- ===========================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  username TEXT UNIQUE,
  full_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  handicap INTEGER DEFAULT 0,
  location TEXT,
  rank INTEGER DEFAULT 15,
  connections_count INTEGER DEFAULT 0,
  tee_times_count INTEGER DEFAULT 0,
  groups_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon_name TEXT,
  category badge_category DEFAULT 'achievement',
  points INTEGER DEFAULT 0,
  rarity badge_rarity DEFAULT 'common',
  criteria TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS golf_courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  description TEXT,
  par INTEGER,
  holes INTEGER DEFAULT 18,
  average_rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- STEP 3: Create Tables with Single Dependencies
-- ===========================================
CREATE TABLE IF NOT EXISTS golf_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  creator_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  max_members INTEGER DEFAULT 8,
  current_members INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  earned_reason TEXT,
  UNIQUE(user_id, badge_id)
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  achievement_name TEXT NOT NULL,
  description TEXT,
  points_earned INTEGER DEFAULT 0,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- STEP 4: Create Tables with Multiple Dependencies
-- ===========================================
CREATE TABLE IF NOT EXISTS tee_times (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES golf_courses(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  tee_time_date DATE NOT NULL,
  tee_time_time TIME NOT NULL,
  max_players INTEGER DEFAULT 4,
  current_players INTEGER DEFAULT 1,
  handicap_requirement TEXT DEFAULT 'any',
  description TEXT,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES golf_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- ===========================================
-- STEP 5: Create Final Tables with Complex Dependencies
-- ===========================================
CREATE TABLE IF NOT EXISTS tee_time_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tee_time_id UUID REFERENCES tee_times(id) ON DELETE CASCADE,
  applicant_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  message TEXT,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tee_time_id, applicant_id)
);

CREATE TABLE IF NOT EXISTS group_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES golf_groups(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- STEP 6: Create Indexes
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_tee_times_date ON tee_times(tee_time_date);
CREATE INDEX IF NOT EXISTS idx_tee_times_course ON tee_times(course_id);
CREATE INDEX IF NOT EXISTS idx_tee_times_creator ON tee_times(creator_id);
CREATE INDEX IF NOT EXISTS idx_golf_courses_location ON golf_courses(location);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_group ON group_messages(group_id);

-- ===========================================
-- STEP 7: Enable Row Level Security
-- ===========================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE golf_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tee_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE tee_time_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE golf_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- STEP 8: Create RLS Policies
-- ===========================================
-- User profiles policies
CREATE POLICY "Users can view all profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Badges policies
CREATE POLICY "Everyone can view badges" ON badges FOR SELECT USING (true);

-- User badges policies
CREATE POLICY "Users can view all user badges" ON user_badges FOR SELECT USING (true);
CREATE POLICY "Users can manage own badges" ON user_badges FOR ALL USING (auth.uid() = user_id);

-- User achievements policies
CREATE POLICY "Users can view all achievements" ON user_achievements FOR SELECT USING (true);
CREATE POLICY "Users can manage own achievements" ON user_achievements FOR ALL USING (auth.uid() = user_id);

-- Golf courses policies
CREATE POLICY "Everyone can view golf courses" ON golf_courses FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create golf courses" ON golf_courses FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Tee times policies
CREATE POLICY "Everyone can view tee times" ON tee_times FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create tee times" ON tee_times FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own tee times" ON tee_times FOR UPDATE USING (auth.uid() = creator_id);

-- Tee time applications policies
CREATE POLICY "Users can view all applications" ON tee_time_applications FOR SELECT USING (true);
CREATE POLICY "Users can manage own applications" ON tee_time_applications FOR ALL USING (auth.uid() = applicant_id);
CREATE POLICY "Tee time creators can manage applications" ON tee_time_applications FOR ALL USING (
  EXISTS (
    SELECT 1 FROM tee_times WHERE id = tee_time_applications.tee_time_id AND creator_id = auth.uid()
  )
);

-- Golf groups policies
CREATE POLICY "Everyone can view golf groups" ON golf_groups FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create groups" ON golf_groups FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Group creators can manage their groups" ON golf_groups FOR ALL USING (auth.uid() = creator_id);

-- Group members policies
CREATE POLICY "Users can view all group members" ON group_members FOR SELECT USING (true);
CREATE POLICY "Users can manage own membership" ON group_members FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Group creators can manage members" ON group_members FOR ALL USING (
  EXISTS (
    SELECT 1 FROM golf_groups WHERE id = group_members.group_id AND creator_id = auth.uid()
  )
);

-- Group messages policies
CREATE POLICY "Users can view all group messages" ON group_messages FOR SELECT USING (true);
CREATE POLICY "Authenticated users can send messages" ON group_messages FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ===========================================
-- STEP 9: Insert Sample Data
-- ===========================================
INSERT INTO badges (name, description, icon_name, category, points, rarity, criteria) VALUES
('First Round', 'Complete your first round of golf', 'flag', 'milestone', 10, 'common', 'Record your first golf round'),
('Early Bird', 'Book a tee time before 8 AM', 'sunrise', 'achievement', 15, 'uncommon', 'Book 5 early morning tee times'),
('Social Butterfly', 'Connect with 10 other golfers', 'users', 'achievement', 20, 'uncommon', 'Make 10 connections'),
('Course Explorer', 'Play at 5 different golf courses', 'map-pin', 'achievement', 25, 'rare', 'Play at 5 unique courses'),
('Consistency King', 'Play 10 rounds in a month', 'calendar', 'achievement', 30, 'rare', 'Play 10 rounds in 30 days'),
('Golf Legend', 'Achieve a handicap of 5 or better', 'trophy', 'achievement', 100, 'legendary', 'Maintain a handicap of 5 or better for 3 months');

-- ===========================================
-- STEP 10: Create Triggers
-- ===========================================
-- Create function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_golf_courses_updated_at BEFORE UPDATE ON golf_courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tee_times_updated_at BEFORE UPDATE ON tee_times FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_golf_groups_updated_at BEFORE UPDATE ON golf_groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
