# Upload Real Golf Course Logos to Supabase

## Step 1: Collect Real Course Logos

### Tennessee Courses:
- **The Honors Course**: [Official Website](https://www.honorscourse.com) - Look for logo in header
- **Belle Meade Country Club**: [Official Website](https://www.bellemeadecc.com) - Look for logo in header
- **Gaylord Springs Golf Links**: [Official Website](https://www.gaylordsprings.com) - Look for logo in header
- **The Hermitage Golf Course**: [Official Website](https://www.hermitagegolf.com) - Look for logo in header
- **Richland Country Club**: [Official Website](https://www.richlandcc.com) - Look for logo in header
- **Nashville Golf & Athletic Club**: [Official Website](https://www.ngac.com) - Look for logo in header
- **The Legacy Golf Course**: [Official Website](https://www.legacygolfcourse.com) - Look for logo in header
- **Harpeth Hills Golf Course**: [Official Website](https://www.harpethhills.com) - Look for logo in header
- **Vanderbilt Legends Club**: [Official Website](https://www.vanderbiltlegends.com) - Look for logo in header
- **The Grove at Williamson County**: [Official Website](https://www.grovegolf.com) - Look for logo in header

### Canton, Georgia Area Courses:
- **Woodmont Golf & Country Club**: [Official Website](http://www.woodmontgolfclub.com) - From Triumph Golf portfolio
- **Canton Golf Club**: [Official Website](https://www.cantongolfclub.com) - Look for logo in header
- **Cherokee Golf & Country Club**: [Official Website](https://www.cherokeegolf.com) - Look for logo in header
- **Cobblestone Golf Course**: [Official Website](https://www.cobblestonegolf.com) - Look for logo in header
- **The Manor Golf & Country Club**: [Official Website](https://www.manorgolf.com) - Look for logo in header
- **RiverPointe Golf Club**: [Official Website](https://www.riverpointegolf.com) - Look for logo in header
- **Canton Golf Course**: [Official Website](https://www.cantongolfcourse.com) - Look for logo in header
- **The Farm Golf Club**: [Official Website](https://www.farmgolfclub.com) - Look for logo in header
- **Cherokee Run Golf Club**: [Official Website](https://www.cherokeerun.com) - Look for logo in header

## Step 2: Upload to Supabase Storage

1. **Go to your Supabase Dashboard**
2. **Navigate to Storage**
3. **Create a new bucket called `course-logos`**
4. **Upload each logo file** (PNG or JPG format, 200x200px recommended)
5. **Make the bucket public** so the images can be accessed

## Step 3: Update Database with Real URLs

After uploading, you'll get URLs like:
```
https://your-project.supabase.co/storage/v1/object/public/course-logos/woodmont-logo.png
```

Then update the database:
```sql
UPDATE golf_courses SET 
    logo_url = 'https://your-project.supabase.co/storage/v1/object/public/course-logos/woodmont-logo.png'
WHERE name = 'Woodmont Golf & Country Club';
```

## Step 4: Alternative - Use High-Quality Golf Images

If you can't find the actual logos, use high-quality golf course images instead:

```sql
-- Use professional golf course photography
UPDATE golf_courses SET 
    logo_url = 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=200&h=200&fit=crop&crop=center&auto=format&q=80',
    course_image_url = 'https://images.unsplash.com/photo-1593111774240-d529f12cf4b0?w=1200&h=800&fit=crop&crop=center&auto=format&q=80'
WHERE name = 'Woodmont Golf & Country Club';
```

## Step 5: Verify the Updates

Run this query to check that all courses have logos:
```sql
SELECT 
    name, 
    location, 
    logo_url,
    CASE 
        WHEN logo_url IS NOT NULL AND logo_url != '' THEN '✅ Logo Updated'
        ELSE '❌ No Logo'
    END as logo_status
FROM golf_courses 
ORDER BY name;
```

## Recommended Approach

1. **Start with Woodmont Golf & Country Club** since you have the reference
2. **Visit their website** at http://www.woodmontgolfclub.com
3. **Download their actual logo**
4. **Upload to Supabase Storage**
5. **Update the database** with the real URL
6. **Repeat for other courses**

This will give you authentic, professional-looking course logos instead of generic images.
