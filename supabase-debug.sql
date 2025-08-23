-- DEBUG SCRIPT - Run this to see what's happening
-- ===========================================
-- Check what tables currently exist
-- ===========================================
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- ===========================================
-- Check if golf_courses table exists and has the right structure
-- ===========================================
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'golf_courses' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ===========================================
-- Check if tee_times table exists and has the right structure
-- ===========================================
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'tee_times' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ===========================================
-- Check for any foreign key constraints
-- ===========================================
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ===========================================
-- Check for any errors in recent operations
-- ===========================================
-- This will show recent errors if any
SELECT * FROM pg_stat_activity 
WHERE state = 'active' 
AND query NOT LIKE '%pg_stat_activity%';
