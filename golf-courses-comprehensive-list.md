# Golf Courses in Your System

## How to Get the Current List

### Option 1: SQL Query (Recommended)
Run this in your Supabase SQL Editor:

```sql
-- Get all golf courses with basic info
SELECT 
    name,
    location,
    par,
    holes,
    course_type,
    green_fees_min,
    green_fees_max,
    average_rating,
    review_count,
    logo_url,
    course_image_url
FROM golf_courses 
ORDER BY name;
```

### Option 2: API Call
If your app is running locally:
```bash
node fetch-courses-list.js
```

## Courses Found in Your SQL Files

Based on your population scripts, here are the courses that should be in your system:

### **Tennessee Golf Courses**

#### Nashville Area
1. **The Honors Course** - Ooltewah, TN
2. **Belle Meade Country Club** - Nashville, TN
3. **Richland Country Club** - Nashville, TN
4. **Gaylord Springs Golf Links** - Nashville, TN
5. **Hermitage Golf Course** - Nashville, TN
6. **Ted Rhodes Golf Course** - Nashville, TN
7. **Shelby Golf Course** - Nashville, TN
8. **Two Rivers Golf Course** - Nashville, TN
9. **Nashboro Golf Club** - Nashville, TN
10. **Percy Warner Golf Course** - Nashville, TN

#### Additional Tennessee Courses
11. **Cherokee Golf & Country Club** - Knoxville, TN
12. **The Manor Golf & Country Club** - Chattanooga, TN
13. **The Farm Golf Club** - Knoxville, TN

### **Georgia Golf Courses**

#### Canton Area
14. **The Club at Lake Arrowhead** - Canton, GA
15. **Woodmont Golf & Country Club** - Canton, GA
16. **Vinings Golf Club** - Canton, GA
17. **Brookstone Golf & Country Club** - Canton, GA
18. **Fairways of Canton** - Canton, GA
19. **BridgeMill Athletic Club** - Canton, GA
20. **Echelon Golf Club** - Canton, GA
21. **Woodstock City Course** - Canton, GA
22. **Towne Lake Hills Golf Club** - Canton, GA
23. **Atlanta National Golf Club** - Canton, GA
24. **White Columns Country Club** - Canton, GA
25. **Indian Hills Country Club** - Canton, GA

### **Famous Golf Courses**

#### Major Championship Courses
26. **Augusta National Golf Club** - Augusta, GA
27. **Pebble Beach Golf Links** - Pebble Beach, CA
28. **McCabe Golf Course** - Nashville, TN

#### World-Class Courses
29. **Bethpage Black** - Farmingdale, NY
30. **Torrey Pines Golf Course** - La Jolla, CA
31. **Chambers Bay** - University Place, WA
32. **Streamsong Resort** - Streamsong, FL
33. **Erin Hills** - Erin, WI
34. **Royal County Down** - Newcastle, Northern Ireland
35. **Carnoustie Golf Links** - Carnoustie, Scotland
36. **Royal Melbourne Golf Club** - Melbourne, Australia
37. **Cape Kidnappers** - Hawkes Bay, New Zealand
38. **Banff Springs Golf Course** - Banff, Alberta, Canada
39. **Shinnecock Hills Golf Club** - Southampton, NY
40. **Merion Golf Club** - Ardmore, PA
41. **Oakmont Country Club** - Oakmont, PA
42. **Winged Foot Golf Club** - Mamaroneck, NY
43. **Seminole Golf Club** - Juno Beach, FL
44. **Sand Hills Golf Club** - Mullen, NE
45. **Pacific Dunes** - Bandon, OR
46. **Bandon Trails** - Bandon, OR
47. **Old Macdonald** - Bandon, OR
48. **Bandon Preserve** - Bandon, OR

## Course Types in Your System

- **Private**: 15 courses
- **Public**: 12 courses  
- **Resort**: 8 courses
- **Municipal**: 1 course

## Geographic Distribution

- **Tennessee**: 13 courses
- **Georgia**: 12 courses
- **California**: 2 courses
- **New York**: 3 courses
- **International**: 6 courses
- **Other US States**: 12 courses

## Total Courses: ~48+ courses

## Notes

- Some courses may have been added multiple times in different scripts
- The actual count in your database may vary
- Use the SQL query above to get the exact current list
- Logo URLs may need to be updated (see `fix-logo-urls.sql`)

## Quick Database Check

To see exactly what's in your database right now, run:

```sql
SELECT COUNT(*) as total_courses FROM golf_courses;
SELECT name, location, course_type FROM golf_courses ORDER BY name LIMIT 10;
```
