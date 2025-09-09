# Golf Course Logo Setup Guide

## Recommended Approach: Local Directory

**Why local is better:**
- ✅ Faster loading (no external API calls)
- ✅ More reliable (no dependency on Supabase storage)
- ✅ Better performance (Next.js image optimization)
- ✅ Easier to manage (all assets in one place)
- ✅ No storage costs

## Step 1: Directory Structure

Your logos will go in: `public/logos/`

```
public/
├── logos/
│   ├── honors-course-logo.png
│   ├── honors-course-image.jpg
│   ├── belle-meade-logo.png
│   ├── belle-meade-image.jpg
│   ├── woodmont-logo.png
│   ├── woodmont-image.jpg
│   └── ... (other course logos)
```

## Step 2: Logo Specifications

**Logo files (for course widgets):**
- Size: 200x200px
- Format: PNG (for transparency) or JPG
- Naming: `{course-name}-logo.png`

**Course image files (for detail pages):**
- Size: 1200x800px
- Format: JPG
- Naming: `{course-name}-image.jpg`

## Step 3: Collect Real Logos

### Tennessee Courses:
1. **The Honors Course** → `honors-course-logo.png`
2. **Belle Meade Country Club** → `belle-meade-logo.png`
3. **Gaylord Springs Golf Links** → `gaylord-springs-logo.png`
4. **The Hermitage Golf Course** → `hermitage-logo.png`
5. **Richland Country Club** → `richland-logo.png`
6. **Nashville Golf & Athletic Club** → `nashville-golf-logo.png`
7. **The Legacy Golf Course** → `legacy-logo.png`
8. **Harpeth Hills Golf Course** → `harpeth-hills-logo.png`
9. **Vanderbilt Legends Club** → `vanderbilt-legends-logo.png`
10. **The Grove at Williamson County** → `grove-williamson-logo.png`

### Canton, Georgia Area Courses:
1. **Woodmont Golf & Country Club** → `woodmont-logo.png`
2. **Canton Golf Club** → `canton-golf-logo.png`
3. **Cherokee Golf & Country Club** → `cherokee-golf-logo.png`
4. **Cobblestone Golf Course** → `cobblestone-logo.png`
5. **The Manor Golf & Country Club** → `manor-golf-logo.png`
6. **RiverPointe Golf Club** → `riverpointe-logo.png`
7. **Canton Golf Course** → `canton-course-logo.png`
8. **The Farm Golf Club** → `farm-golf-logo.png`
9. **Cherokee Run Golf Club** → `cherokee-run-logo.png`

## Step 4: Upload Process

1. **Visit each course's website**
2. **Find their logo** (usually in header or footer)
3. **Download the logo**
4. **Resize to 200x200px** (for logos)
5. **Resize to 1200x800px** (for course images)
6. **Save with the correct filename** in `public/logos/`

## Step 5: Update Database

Run the SQL script: `update-golf-course-logos-local.sql`

This will update all courses with local file paths like:
- Logo: `/logos/woodmont-logo.png`
- Image: `/logos/woodmont-image.jpg`

## Step 6: Test

After uploading logos and running the SQL:
1. **Check your dashboard** - course widgets should show logos
2. **Click "View Details"** - course pages should show images
3. **Verify all courses** have logos

## Fallback Images

If you can't find a specific course logo, use a default golf image:
- `default-golf-logo.png` (200x200px)
- `default-golf-image.jpg` (1200x800px)

## Benefits of This Approach

- **Fast loading** - Images served directly by your app
- **Reliable** - No external dependencies
- **Optimized** - Next.js handles image optimization
- **Cost-effective** - No storage fees
- **Easy to manage** - All assets in one place

## Next Steps

1. **Start with Woodmont Golf & Country Club** (you have the reference)
2. **Collect 2-3 logos** to test the system
3. **Upload them to `public/logos/`**
4. **Run the SQL script**
5. **Test in your app**
6. **Continue with remaining courses**

This approach will give you the best performance and user experience!
