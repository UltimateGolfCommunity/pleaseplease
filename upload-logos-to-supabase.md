# Upload Course Logos to Supabase - Easy Method

## 🚀 **Quick & Easy Logo Upload**

### **Step 1: Get Your Course Logos**

1. **Visit each course website** and find their logo
2. **Right-click and "Save image as..."** 
3. **Save with descriptive names:**
   - `canton-golf-club-logo.png`
   - `the-grove-logo.png`
   - `vanderbilt-legends-logo.png`
   - etc.

### **Step 2: Upload to Supabase Storage**

1. **Go to your Supabase Dashboard**
2. **Click "Storage" in the left sidebar**
3. **Create a new bucket:**
   - Name: `course-logos`
   - Public: ✅ (check this box)
4. **Upload your logo files** to the bucket

### **Step 3: Get the Public URLs**

After uploading, each logo will have a URL like:
```
https://your-project-id.supabase.co/storage/v1/object/public/course-logos/canton-golf-club-logo.png
```

### **Step 4: Update Database**

Go to **SQL Editor** and run this script (replace the URLs with your actual ones):

```sql
-- Update course logos with Supabase storage URLs
UPDATE golf_courses 
SET logo_url = 'https://your-project-id.supabase.co/storage/v1/object/public/course-logos/canton-golf-club-logo.png'
WHERE name = 'Canton Golf Club';

UPDATE golf_courses 
SET logo_url = 'https://your-project-id.supabase.co/storage/v1/object/public/course-logos/the-grove-logo.png'
WHERE name = 'The Grove';

UPDATE golf_courses 
SET logo_url = 'https://your-project-id.supabase.co/storage/v1/object/public/course-logos/vanderbilt-legends-logo.png'
WHERE name = 'Vanderbilt Legends Club';

-- Add more courses as you get their logos...
```

## 🎯 **Start with 5 Courses**

I recommend starting with these 5 courses:

1. **Canton Golf Club** - https://www.cantongolfclub.com
2. **The Grove** - https://www.thegrove.com  
3. **Vanderbilt Legends Club** - https://www.vanderbiltlegends.com
4. **Tennessee National Golf Club** - https://www.tennesseenational.com
5. **The Club at Lake Arrowhead** - https://www.lakearrowheadclub.com

## 📱 **Test the Results**

After uploading and updating:
1. **Go to your dashboard**
2. **Click "Courses" tab**
3. **Find a course with a logo**
4. **Click "View Details"**
5. **Check if the logo displays correctly**

## 🔧 **Troubleshooting**

If logos don't show:
1. **Check the Supabase URL** is correct
2. **Verify the bucket is public**
3. **Make sure file names match exactly**
4. **Check the database** for updated logo_url values

## 🎨 **Logo Tips**

- **PNG format** works best
- **Square format** (200x200px) ideal
- **Transparent background** preferred
- **High resolution** for crisp display

---

**This method is much simpler than the automated tools - just upload and update!**

