# Fix Group Creation - Database Schema Update

## Problem
Group creation is failing with error:
```
"Could not find the 'location' column of 'golf_groups' in the schema cache"
```

## Solution
The `golf_groups` table is missing the `location` and `logo_url` columns.

## How to Fix

### Step 1: Access Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click on "SQL Editor" in the left sidebar

### Step 2: Run the SQL Script
Copy and paste the following SQL into the SQL Editor and click "Run":

```sql
-- Add location and logo_url columns to golf_groups table

-- Add location column if it doesn't exist
ALTER TABLE golf_groups 
ADD COLUMN IF NOT EXISTS location TEXT;

-- Add logo_url column if it doesn't exist
ALTER TABLE golf_groups 
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add index for location searches
CREATE INDEX IF NOT EXISTS idx_golf_groups_location ON golf_groups(location);

-- Add index for logo_url to speed up queries
CREATE INDEX IF NOT EXISTS idx_golf_groups_logo_url ON golf_groups(logo_url);

-- Verify the columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'golf_groups'
ORDER BY ordinal_position;
```

### Step 3: Verify
After running the script, you should see output showing all columns in the `golf_groups` table, including:
- `location` (text)
- `logo_url` (text)

### Step 4: Test
Try creating a group again - it should work now!

## Alternative: Copy from File
The SQL script is also available in the file: `add-group-columns.sql`

Just copy the contents and paste into Supabase SQL Editor.

## What These Columns Do
- **location**: Stores the group's location (e.g., "Nashville, TN")
- **logo_url**: Stores the URL to the uploaded group logo image

Both columns are optional (nullable) and will be used to enhance the group display with location info and custom logos.

