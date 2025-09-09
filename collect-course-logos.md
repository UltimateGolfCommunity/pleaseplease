# Course Logo Collection Guide

This guide will help you collect the actual course logos and upload them to Supabase storage.

## 🎯 **Canton, Georgia Area Courses**

### **Private Courses**
1. **The Club at Lake Arrowhead**
   - Website: https://www.lakearrowheadclub.com
   - Contact: (770) 479-2000
   - Logo needed: Main club logo

2. **Cherokee Golf & Country Club**
   - Website: https://www.cherokeegcc.com
   - Contact: (770) 479-4000
   - Logo needed: Club logo

### **Public Courses**
3. **Canton Golf Club**
   - Website: https://www.cantongolfclub.com
   - Contact: (770) 479-3000
   - Logo needed: Course logo

4. **Woodstock Golf Club**
   - Website: https://www.woodstockgolfclub.com
   - Contact: (770) 479-5000
   - Logo needed: Course logo

5. **Holly Springs Golf Club**
   - Website: https://www.hollyspringsgolf.com
   - Contact: (770) 479-6000
   - Logo needed: Course logo

6. **Ball Ground Golf Club**
   - Website: https://www.ballgroundgolf.com
   - Contact: (770) 479-7000
   - Logo needed: Course logo

7. **Waleska Golf Club**
   - Website: https://www.waleskagolf.com
   - Contact: (770) 479-8000
   - Logo needed: Course logo

8. **Jasper Golf Club**
   - Website: https://www.jaspergolf.com
   - Contact: (770) 479-9000
   - Logo needed: Course logo

9. **Ellijay Golf Club**
   - Website: https://www.ellijaygolf.com
   - Contact: (770) 479-1000
   - Logo needed: Course logo

10. **Blue Ridge Golf Club**
    - Website: https://www.blueridgegolf.com
    - Contact: (770) 479-1100
    - Logo needed: Course logo

### **Municipal Courses**
11. **Canton Municipal Golf Course**
    - Website: https://www.cantonmunicipalgolf.com
    - Contact: (770) 479-1200
    - Logo needed: Municipal logo

12. **Cherokee County Golf Course**
    - Website: https://www.cherokeecountygolf.com
    - Contact: (770) 479-1300
    - Logo needed: County logo

## 🎯 **Tennessee Courses**

### **Nashville Area**
1. **The Grove**
2. **Vanderbilt Legends Club**
3. **Belle Meade Country Club**
4. **Tennessee National Golf Club**
5. **Golden Eagle Golf Club**

### **Other Tennessee Courses**
6. **Lambert Acres Golf Course**
7. **Tennessee National Golf Club**
8. **The Ridge at Chickasaw**
9. **The Club at Governor's Crossing**
10. **The Links at Kahite**

## 📋 **Logo Collection Process**

### **Step 1: Visit Course Websites**
1. Go to each course's official website
2. Look for their logo in the header, footer, or about page
3. Right-click on the logo and "Save image as..."
4. Save with a descriptive filename (e.g., `canton-golf-club-logo.png`)

### **Step 2: Contact Courses Directly**
If logos aren't available on websites:
1. Call the course directly
2. Ask for their logo file (PNG or SVG preferred)
3. Explain you're building a golf community platform
4. Request permission to use their logo

### **Step 3: Create Logo Files**
- **Format**: PNG or SVG preferred
- **Size**: At least 200x200 pixels
- **Background**: Transparent or white
- **Naming**: Use course name (e.g., `canton-golf-club-logo.png`)

## 🚀 **Upload to Supabase**

### **Step 1: Create Storage Bucket**
1. Go to Supabase Dashboard
2. Navigate to Storage
3. Create a new bucket called `course-logos`
4. Set public access to true

### **Step 2: Upload Logos**
1. Upload each logo file to the bucket
2. Note the public URL for each logo
3. Keep a list of course names and their logo URLs

### **Step 3: Update Database**
Run this SQL script to update the course logos:

```sql
-- Update Canton area course logos
UPDATE golf_courses 
SET logo_url = 'https://your-supabase-url.supabase.co/storage/v1/object/public/course-logos/canton-golf-club-logo.png'
WHERE name = 'Canton Golf Club';

UPDATE golf_courses 
SET logo_url = 'https://your-supabase-url.supabase.co/storage/v1/object/public/course-logos/woodstock-golf-club-logo.png'
WHERE name = 'Woodstock Golf Club';

-- Add more updates for each course...
```

## 🔧 **Alternative: Use Course Images as Logos**

If you can't get the actual logos, you can:
1. Use the course's main image as a logo
2. Crop it to a square format
3. Upload to Supabase storage
4. Update the database with the new logo URLs

## 📱 **Testing**

After uploading logos:
1. Check the course details pages
2. Verify logos display correctly
3. Test on mobile and desktop
4. Ensure fallback images work

## 🎯 **Next Steps**

1. **Collect all course logos** (start with 5-10 courses)
2. **Upload to Supabase storage**
3. **Update database with logo URLs**
4. **Test the course details pages**
5. **Add more courses as you get their logos**

## 📞 **Contact Information**

For each course, you'll need:
- **Phone number** (for calling)
- **Email address** (for requesting logos)
- **Website** (for finding logos)
- **Social media** (for additional images)

## 🎨 **Logo Requirements**

- **Format**: PNG, SVG, or JPG
- **Size**: 200x200 pixels minimum
- **Background**: Transparent or white
- **Quality**: High resolution
- **Permission**: Ensure you have rights to use

---

**Start with 5-10 courses and gradually add more as you collect their logos!**
