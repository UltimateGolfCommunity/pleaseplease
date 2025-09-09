# Golf Course Logo Finder Guide

## 🏌️‍♂️ Manual Logo Collection Process

Since many golf course logos are copyrighted, here's a systematic approach to find and collect logos legally:

### **Step 1: Create Logo Directory**
```bash
mkdir -p public/logos
```

### **Step 2: Golf Courses to Find Logos For**

#### **Tennessee Courses**
1. **The Honors Course** - Ooltewah, TN
2. **Sweetens Cove Golf Club** - South Pittsburg, TN  
3. **The Golf Club of Tennessee** - Kingston Springs, TN
4. **Hermitage Golf Course** - Old Hickory, TN
5. **Gaylord Springs Golf Links** - Nashville, TN
6. **The Grove** - College Grove, TN
7. **Bear Trace at Harrison Bay** - Harrison, TN
8. **The Legacy Golf Course** - Springfield, TN
9. **The Club at Fairvue Plantation** - Gallatin, TN
10. **The Course at Sewanee** - Sewanee, TN

#### **Georgia Courses**
11. **The Club at Lake Arrowhead** - Canton, GA
12. **Woodmont Golf & Country Club** - Canton, GA
13. **Vinings Golf Club** - Canton, GA
14. **Brookstone Golf & Country Club** - Canton, GA
15. **Fairways of Canton** - Canton, GA
16. **BridgeMill Athletic Club** - Canton, GA
17. **Echelon Golf Club** - Canton, GA
18. **Woodstock City Course** - Canton, GA
19. **Towne Lake Hills Golf Club** - Canton, GA
20. **Atlanta National Golf Club** - Canton, GA
21. **White Columns Country Club** - Canton, GA
22. **Indian Hills Country Club** - Canton, GA

#### **Famous Courses**
23. **Augusta National Golf Club** - Augusta, GA
24. **Pebble Beach Golf Links** - Pebble Beach, CA
25. **McCabe Golf Course** - Nashville, TN
26. **Bethpage Black** - Farmingdale, NY
27. **Torrey Pines Golf Course** - La Jolla, CA
28. **Chambers Bay** - University Place, WA
29. **Streamsong Resort** - Streamsong, FL
30. **Erin Hills** - Erin, WI

### **Step 3: Logo Search Strategy**

#### **Method 1: Official Websites**
1. Visit each golf course's official website
2. Look for logos in:
   - Header/footer
   - About page
   - Media/press kit
   - Contact page

#### **Method 2: Google Images Search**
Search terms to try:
- `"[Course Name]" logo site:golf.com`
- `"[Course Name]" logo site:golfdigest.com`
- `"[Course Name]" logo site:golf.com`
- `"[Course Name]" country club logo`
- `"[Course Name]" golf club emblem`

#### **Method 3: Stock Photo Sites**
- **Shutterstock**: Search for "[Course Name] logo"
- **Adobe Stock**: Search for golf course logos
- **Getty Images**: Professional golf imagery
- **Unsplash**: Free golf course images

#### **Method 4: Golf Media Sites**
- **Golf Digest**: Course reviews often include logos
- **Golf.com**: Course listings
- **Golf Magazine**: Course features
- **PGA Tour**: Tournament course logos

### **Step 4: Logo Requirements**

#### **File Specifications**
- **Format**: PNG (preferred) or JPG
- **Size**: 200x200px minimum, 400x400px preferred
- **Background**: Transparent (PNG) or white
- **Quality**: High resolution, clear text

#### **Naming Convention**
```
[course-name].png
```
Examples:
- `the_honors_course.png`
- `woodmont_golf_country_club.png`
- `augusta_national_golf_club.png`

### **Step 5: Legal Considerations**

#### **Copyright Issues**
- Many golf course logos are trademarked
- Contact courses directly for permission
- Use only for educational/non-commercial purposes
- Consider creating generic golf logos instead

#### **Alternative Approach**
Create generic golf-themed logos:
- Golf ball with course name
- Golf club silhouette
- Course silhouette with text
- Generic country club emblem

### **Step 6: Quick Logo Sources**

#### **Public Domain/Free Sources**
1. **Wikimedia Commons**: Some golf course logos
2. **OpenClipart**: Generic golf logos
3. **Pixabay**: Free golf course images
4. **Pexels**: Free golf imagery

#### **Famous Course Logos (Often Available)**
- **Augusta National**: Green jacket logo
- **Pebble Beach**: Wave and golf ball
- **Torrey Pines**: Pine tree logo
- **Chambers Bay**: Bridge silhouette

### **Step 7: Implementation**

#### **Download Process**
1. Find logo image
2. Right-click → Save Image As
3. Rename to course name format
4. Save to `public/logos/`
5. Update database with new URL

#### **Database Update**
```sql
UPDATE golf_courses SET 
    logo_url = '/logos/[filename].png',
    course_image_url = '/logos/[filename].png'
WHERE name = '[Course Name]';
```

### **Step 8: Fallback Strategy**

If official logos aren't available:
1. Use generic golf ball logo
2. Create text-based logo with course name
3. Use course aerial photo as logo
4. Use generic country club emblem

### **Step 9: Quality Check**

#### **Logo Review**
- [ ] Clear and readable
- [ ] Appropriate size (200x200px+)
- [ ] Good contrast
- [ ] Professional appearance
- [ ] Consistent style across all logos

### **Step 10: Legal Compliance**

#### **Before Using**
- [ ] Verify copyright status
- [ ] Contact course for permission if needed
- [ ] Use only for intended purpose
- [ ] Credit source if required
- [ ] Consider fair use guidelines

## 🎯 Quick Start Commands

```bash
# Create logos directory
mkdir -p public/logos

# Run the Python script (if you have the dependencies)
python3 download-golf-logos.py

# Or manually download and save logos to public/logos/
```

## 📝 Next Steps

1. **Start with famous courses** (easier to find logos)
2. **Contact local courses** for official logo permission
3. **Create generic logos** for courses without official ones
4. **Update database** with new logo URLs
5. **Test logo display** in your application

## ⚠️ Important Notes

- **Always respect copyright laws**
- **Contact courses directly when possible**
- **Use high-quality images**
- **Maintain consistent naming**
- **Test logo display in your app**
