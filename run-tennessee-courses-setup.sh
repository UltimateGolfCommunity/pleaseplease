#!/bin/bash

# Tennessee Golf Courses Setup Script
# This script helps you add Tennessee golf courses to your Supabase database

echo "🏌️ Tennessee Golf Courses Setup"
echo "================================"
echo ""

# Check if we're in the right directory
if [ ! -f "populate-tennessee-golf-courses.sql" ]; then
    echo "❌ Error: populate-tennessee-golf-courses.sql not found in current directory"
    echo "Please run this script from the project root directory"
    exit 1
fi

echo "📋 This script will add 10 Tennessee golf courses to your database:"
echo ""
echo "🏆 Featured Courses:"
echo "  • The Honors Course (Private) - Pete Dye design"
echo "  • Sweetens Cove Golf Club (Public) - 9-hole gem"
echo "  • The Golf Club of Tennessee (Private) - Tom Fazio design"
echo "  • Hermitage Golf Course (Public) - Two championship courses"
echo "  • Gaylord Springs Golf Links (Public) - Scottish-style links"
echo "  • The Grove (Public) - Greg Norman design"
echo ""
echo "🏌️ Additional Courses:"
echo "  • Bear Trace at Harrison Bay (Public) - Jack Nicklaus Signature"
echo "  • The Legacy Golf Course (Public) - Bruce Harris design"
echo "  • The Club at Fairvue Plantation (Private) - Two courses"
echo "  • The Course at Sewanee (Public) - Mountain course"
echo ""

# Check if enhance-golf-courses-schema.sql exists
if [ -f "enhance-golf-courses-schema.sql" ]; then
    echo "📝 Note: Make sure you've run enhance-golf-courses-schema.sql first"
    echo "   This adds the necessary fields for course images, logos, and amenities"
    echo ""
fi

echo "🚀 To add these courses to your Supabase database:"
echo ""
echo "1. Go to your Supabase Dashboard"
echo "2. Navigate to SQL Editor"
echo "3. Copy and paste the contents of populate-tennessee-golf-courses.sql"
echo "4. Run the script"
echo ""
echo "📁 The SQL file is located at: $(pwd)/populate-tennessee-golf-courses.sql"
echo ""

# Show a preview of what will be added
echo "🔍 Preview of what will be added:"
echo "================================="
head -20 populate-tennessee-golf-courses.sql
echo "..."
echo "(See full file for complete details)"
echo ""

echo "✅ Setup instructions complete!"
echo "After running the SQL script, your Tennessee golf courses will be available in the courses section."
