-- MINIMAL WORKING SCHEMA - Run each section separately
-- ===========================================
-- SECTION 1: Create types only
-- ===========================================
CREATE TYPE badge_rarity AS ENUM ('common', 'uncommon', 'rare', 'epic', 'legendary');
CREATE TYPE badge_category AS ENUM ('achievement', 'milestone', 'early_adopter', 'special');

-- ===========================================
-- SECTION 2: Create user_profiles table
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

-- ===========================================
-- SECTION 3: Create badges table
-- ===========================================
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

-- ===========================================
-- SECTION 4: Create golf_courses table
-- ===========================================
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
-- SECTION 5: Create golf_groups table
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

-- ===========================================
-- SECTION 6: Create user_badges table
-- ===========================================
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  earned_reason TEXT,
  UNIQUE(user_id, badge_id)
);

-- ===========================================
-- SECTION 7: Create user_achievements table
-- ===========================================
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  achievement_name TEXT NOT NULL,
  description TEXT,
  points_earned INTEGER DEFAULT 0,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- SECTION 8: Create tee_times table (AFTER golf_courses exists)
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

-- ===========================================
-- SECTION 9: Create group_members table
-- ===========================================
CREATE TABLE IF NOT EXISTS group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES golf_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- ===========================================
-- SECTION 10: Create tee_time_applications table (AFTER tee_times exists)
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

-- ===========================================
-- SECTION 11: Create group_messages table
-- ===========================================
CREATE TABLE IF NOT EXISTS group_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES golf_groups(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- SECTION 12: Insert sample badges
-- ===========================================
INSERT INTO badges (name, description, icon_name, category, points, rarity, criteria) VALUES
('First Round', 'Complete your first round of golf', 'flag', 'milestone', 10, 'common', 'Record your first golf round'),
('Early Bird', 'Book a tee time before 8 AM', 'sunrise', 'achievement', 15, 'uncommon', 'Book 5 early morning tee times'),
('Social Butterfly', 'Connect with 10 other golfers', 'users', 'achievement', 20, 'uncommon', 'Make 10 connections');
