// Simple script to fetch golf courses from your API
// Run with: node fetch-courses-list.js

const fetch = require('node-fetch');

async function getGolfCourses() {
  try {
    console.log('🔍 Fetching golf courses from API...\n');
    
    const response = await fetch('http://localhost:3000/api/golf-courses?limit=100');
    const data = await response.json();
    
    if (data.courses && data.courses.length > 0) {
      console.log(`📊 Found ${data.courses.length} golf courses:\n`);
      
      data.courses.forEach((course, index) => {
        console.log(`${index + 1}. ${course.name}`);
        console.log(`   Location: ${course.location}`);
        console.log(`   Par: ${course.par} | Holes: ${course.holes}`);
        console.log(`   Type: ${course.course_type || 'Not specified'}`);
        console.log(`   Rating: ${course.average_rating || 'No reviews'} (${course.review_count || 0} reviews)`);
        console.log(`   Logo: ${course.logo_url || 'No logo'}`);
        console.log(`   Image: ${course.course_image_url || 'No image'}`);
        if (course.green_fees_min && course.green_fees_max) {
          console.log(`   Green Fees: $${course.green_fees_min} - $${course.green_fees_max}`);
        }
        console.log('');
      });
      
      console.log(`\n✅ Total: ${data.courses.length} courses`);
      if (data.usingMockData) {
        console.log('⚠️  Note: Using mock data (database may be unavailable)');
      }
    } else {
      console.log('❌ No courses found');
    }
  } catch (error) {
    console.error('❌ Error fetching courses:', error.message);
    console.log('\n💡 Make sure your Next.js app is running on localhost:3000');
  }
}

getGolfCourses();
