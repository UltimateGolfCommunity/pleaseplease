-- Add header_image_url field to user_profiles table
-- Run this in your Supabase SQL Editor

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS header_image_url TEXT;

-- Add comment to document the field
COMMENT ON COLUMN user_profiles.header_image_url IS 'URL or base64 data for the user profile header image';
