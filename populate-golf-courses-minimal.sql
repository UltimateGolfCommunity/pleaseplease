-- Minimal Golf Courses Insert (Essential Fields Only)
-- Run this after populate-golf-courses-individual.sql

-- Course 11: Bethpage Black
INSERT INTO golf_courses (name, location, description, par, holes, course_type, green_fees_min, green_fees_max, is_featured, is_active) 
VALUES ('Bethpage Black', 'Farmingdale, NY', 'Challenging public course that hosted multiple majors.', 71, 18, 'public', 75, 75, true, true);

-- Course 12: Torrey Pines
INSERT INTO golf_courses (name, location, description, par, holes, course_type, green_fees_min, green_fees_max, is_featured, is_active) 
VALUES ('Torrey Pines Golf Course', 'La Jolla, CA', 'Municipal course with stunning Pacific Ocean views.', 72, 18, 'municipal', 65, 65, true, true);

-- Course 13: Chambers Bay
INSERT INTO golf_courses (name, location, description, par, holes, course_type, green_fees_min, green_fees_max, is_featured, is_active) 
VALUES ('Chambers Bay', 'University Place, WA', 'Links-style course with dramatic elevation changes.', 72, 18, 'public', 85, 85, true, true);

-- Course 14: Streamsong Resort
INSERT INTO golf_courses (name, location, description, par, holes, course_type, green_fees_min, green_fees_max, is_featured, is_active) 
VALUES ('Streamsong Resort', 'Streamsong, FL', 'Modern links-style courses with dramatic sand dunes.', 72, 18, 'resort', 275, 275, true, true);

-- Course 15: Erin Hills
INSERT INTO golf_courses (name, location, description, par, holes, course_type, green_fees_min, green_fees_max, is_featured, is_active) 
VALUES ('Erin Hills', 'Erin, WI', 'Championship course that hosted the 2017 U.S. Open.', 72, 18, 'public', 95, 95, true, true);

-- Course 16: Royal County Down
INSERT INTO golf_courses (name, location, description, par, holes, course_type, green_fees_min, green_fees_max, is_featured, is_active) 
VALUES ('Royal County Down', 'Newcastle, Northern Ireland', 'Stunning links course with dramatic mountain and sea views.', 71, 18, 'private', 0, 0, true, true);

-- Course 17: Carnoustie
INSERT INTO golf_courses (name, location, description, par, holes, course_type, green_fees_min, green_fees_max, is_featured, is_active) 
VALUES ('Carnoustie Golf Links', 'Carnoustie, Scotland', 'Challenging championship links course known for difficulty.', 72, 18, 'public', 195, 195, true, true);

-- Course 18: Royal Melbourne
INSERT INTO golf_courses (name, location, description, par, holes, course_type, green_fees_min, green_fees_max, is_featured, is_active) 
VALUES ('Royal Melbourne Golf Club', 'Melbourne, Australia', 'World-class sandbelt course with challenging bunkers.', 72, 18, 'private', 0, 0, true, true);

-- Course 19: Cape Kidnappers
INSERT INTO golf_courses (name, location, description, par, holes, course_type, green_fees_min, green_fees_max, is_featured, is_active) 
VALUES ('Cape Kidnappers', 'Hawkes Bay, New Zealand', 'Dramatic clifftop course with stunning ocean views.', 72, 18, 'resort', 295, 295, true, true);

-- Course 20: Banff Springs
INSERT INTO golf_courses (name, location, description, par, holes, course_type, green_fees_min, green_fees_max, is_featured, is_active) 
VALUES ('Banff Springs Golf Course', 'Banff, Alberta, Canada', 'Mountain course with stunning Rocky Mountain views.', 72, 18, 'resort', 195, 195, true, true);

-- Verify the data was inserted
SELECT 'Minimal courses inserted successfully!' AS status, COUNT(*) AS total_courses FROM golf_courses;
