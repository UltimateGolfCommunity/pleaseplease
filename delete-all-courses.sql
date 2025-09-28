-- Delete All Courses SQL Script
-- This script will remove all golf courses from the database
-- allowing users to upload their own courses for review

-- WARNING: This will permanently delete all existing golf courses!
-- Make sure to backup your data before running this script.

-- Step 1: Delete all course reviews (if they exist)
DELETE FROM course_reviews WHERE course_id IN (
  SELECT id FROM golf_courses
);

-- Step 2: Delete all tee times associated with courses
DELETE FROM tee_times WHERE course_id IN (
  SELECT id FROM golf_courses
);

-- Step 3: Delete all tee time applications for courses
DELETE FROM tee_time_applications WHERE tee_time_id IN (
  SELECT id FROM tee_times WHERE course_id IN (
    SELECT id FROM golf_courses
  )
);

-- Step 4: Finally, delete all golf courses
DELETE FROM golf_courses;

-- Optional: Reset the sequence/auto-increment if using serial/auto-increment
-- ALTER SEQUENCE golf_courses_id_seq RESTART WITH 1;

-- Verify deletion
SELECT COUNT(*) as remaining_courses FROM golf_courses;
SELECT COUNT(*) as remaining_tee_times FROM tee_times;
SELECT COUNT(*) as remaining_reviews FROM course_reviews;

-- Success message
SELECT 'All golf courses have been successfully deleted. Users can now upload their own courses for review.' as message;
