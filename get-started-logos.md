# Get Started with Course Logos

## 🚀 **Quick Start: Get 5 Course Logos**

### **Step 1: Choose 5 Courses to Start With**

I recommend starting with these 5 courses:

1. **Canton Golf Club** (Canton, GA)
   - Website: https://www.cantongolfclub.com
   - Phone: (770) 479-2772
   - Look for logo in header or footer

2. **The Grove** (Nashville, TN)
   - Website: https://www.thegrove.com
   - Look for logo on homepage

3. **Vanderbilt Legends Club** (Franklin, TN)
   - Website: https://www.vanderbiltlegends.com
   - Look for logo in header

4. **Tennessee National Golf Club** (Loudon, TN)
   - Website: https://www.tennesseenational.com
   - Look for logo on homepage

5. **The Club at Lake Arrowhead** (Canton, GA)
   - Website: https://www.lakearrowheadclub.com
   - Look for logo in header

### **Step 2: Collect the Logos**

For each course:
1. **Visit the website**
2. **Look for the logo** (usually in header, footer, or about page)
3. **Right-click on the logo** and "Save image as..."
4. **Save with this naming convention:**
   - `canton-golf-club-logo.png`
   - `the-grove-logo.png`
   - `vanderbilt-legends-club-logo.png`
   - `tennessee-national-golf-club-logo.png`
   - `lake-arrowhead-club-logo.png`

### **Step 3: Upload to Supabase**

1. **Go to your Supabase Dashboard**
2. **Navigate to Storage**
3. **Create a bucket called `course-logos`**
4. **Set it to public**
5. **Upload your 5 logo files**

### **Step 4: Update Database**

1. **Go to SQL Editor in Supabase**
2. **Copy the SQL script below**
3. **Replace `your-supabase-url` with your actual Supabase URL**
4. **Run the script**

```sql
-- Update the 5 starter course logos
UPDATE golf_courses 
SET logo_url = 'https://your-supabase-url.supabase.co/storage/v1/object/public/course-logos/canton-golf-club-logo.png'
WHERE name = 'Canton Golf Club';

UPDATE golf_courses 
SET logo_url = 'https://your-supabase-url.supabase.co/storage/v1/object/public/course-logos/the-grove-logo.png'
WHERE name = 'The Grove';

UPDATE golf_courses 
SET logo_url = 'https://your-supabase-url.supabase.co/storage/v1/object/public/course-logos/vanderbilt-legends-club-logo.png'
WHERE name = 'Vanderbilt Legends Club';

UPDATE golf_courses 
SET logo_url = 'https://your-supabase-url.supabase.co/storage/v1/object/public/course-logos/tennessee-national-golf-club-logo.png'
WHERE name = 'Tennessee National Golf Club';

UPDATE golf_courses 
SET logo_url = 'https://your-supabase-url.supabase.co/storage/v1/object/public/course-logos/lake-arrowhead-club-logo.png'
WHERE name = 'The Club at Lake Arrowhead';
```

### **Step 5: Test the Results**

1. **Go to your dashboard**
2. **Click on the "Courses" tab**
3. **Find one of the 5 courses**
4. **Click "View Details"**
5. **Check if the logo displays correctly**

## 🎯 **What You'll See**

After uploading the logos:
- **Course details pages** will show the actual course logos
- **Dashboard course cards** will display the real logos
- **Professional appearance** with authentic branding

## 📱 **Next Steps**

Once you have 5 logos working:
1. **Add 5 more courses** (repeat the process)
2. **Contact courses directly** for high-quality logos
3. **Use social media** to find additional logo images
4. **Gradually replace** all generic Unsplash images

## 🔧 **Troubleshooting**

If logos don't display:
1. **Check the Supabase URL** is correct
2. **Verify the bucket is public**
3. **Ensure file names match** exactly
4. **Check the database** for the updated logo_url values

## 🎨 **Logo Tips**

- **PNG format** works best for logos
- **Transparent background** preferred
- **Square format** (200x200 pixels) ideal
- **High resolution** for crisp display

---

**Start with these 5 courses and you'll have real logos in 30 minutes!**
