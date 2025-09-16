-- Simple cleanup: Remove all old tee times and applications
-- Run this in your Supabase SQL Editor

-- ===========================================
-- Delete all existing tee times
-- ===========================================
DELETE FROM tee_times;

-- ===========================================
-- Delete all tee time applications
-- ===========================================
DELETE FROM tee_time_applications;

-- ===========================================
-- Verify cleanup
-- ===========================================
SELECT 'Cleanup completed' as status;
SELECT COUNT(*) as remaining_tee_times FROM tee_times;
SELECT COUNT(*) as remaining_applications FROM tee_time_applications;
