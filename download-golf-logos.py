#!/usr/bin/env python3
"""
Golf Course Logo Downloader
Downloads logos for golf courses in your system
"""

import requests
import os
from urllib.parse import urlparse
import time
import json

# Golf courses from your system
GOLF_COURSES = [
    # Tennessee Courses
    "The Honors Course",
    "Sweetens Cove Golf Club", 
    "The Golf Club of Tennessee",
    "Hermitage Golf Course",
    "Gaylord Springs Golf Links",
    "The Grove",
    "Bear Trace at Harrison Bay",
    "The Legacy Golf Course",
    "The Club at Fairvue Plantation",
    "The Course at Sewanee",
    
    # Georgia Courses
    "The Club at Lake Arrowhead",
    "Woodmont Golf & Country Club",
    "Vinings Golf Club",
    "Brookstone Golf & Country Club",
    "Fairways of Canton",
    "BridgeMill Athletic Club",
    "Echelon Golf Club",
    "Woodstock City Course",
    "Towne Lake Hills Golf Club",
    "Atlanta National Golf Club",
    "White Columns Country Club",
    "Indian Hills Country Club",
    
    # Famous Courses
    "Augusta National Golf Club",
    "Pebble Beach Golf Links",
    "McCabe Golf Course",
    "Bethpage Black",
    "Torrey Pines Golf Course",
    "Chambers Bay",
    "Streamsong Resort",
    "Erin Hills",
    "Royal County Down",
    "Carnoustie Golf Links",
    "Royal Melbourne Golf Club",
    "Cape Kidnappers",
    "Banff Springs Golf Course",
    "Shinnecock Hills Golf Club",
    "Merion Golf Club",
    "Oakmont Country Club",
    "Winged Foot Golf Club",
    "Seminole Golf Club",
    "Sand Hills Golf Club",
    "Pacific Dunes",
    "Bandon Trails",
    "Old Macdonald",
    "Bandon Preserve"
]

# Common logo search terms and URLs
LOGO_SOURCES = {
    "Augusta National Golf Club": "https://www.augusta.com/sites/default/files/2021-03/ANGC_logo.png",
    "Pebble Beach Golf Links": "https://www.pebblebeach.com/sites/default/files/2021-03/pebble-beach-logo.png",
    "Torrey Pines Golf Course": "https://www.torreypines.com/sites/default/files/2021-03/torrey-pines-logo.png",
    "Chambers Bay": "https://www.chambersbaygolf.com/sites/default/files/2021-03/chambers-bay-logo.png",
    "Streamsong Resort": "https://www.streamsongresort.com/sites/default/files/2021-03/streamsong-logo.png",
    "Erin Hills": "https://www.erinhills.com/sites/default/files/2021-03/erin-hills-logo.png",
    "Bethpage Black": "https://www.bethpagegolfcourse.com/sites/default/files/2021-03/bethpage-logo.png"
}

def create_logo_directory():
    """Create the logos directory if it doesn't exist"""
    logo_dir = "public/logos"
    if not os.path.exists(logo_dir):
        os.makedirs(logo_dir)
        print(f"✅ Created directory: {logo_dir}")
    return logo_dir

def download_logo(url, filename, logo_dir):
    """Download a logo from URL and save as PNG"""
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        filepath = os.path.join(logo_dir, f"{filename}.png")
        
        with open(filepath, 'wb') as f:
            f.write(response.content)
        
        print(f"✅ Downloaded: {filename}")
        return True
    except Exception as e:
        print(f"❌ Failed to download {filename}: {e}")
        return False

def search_google_images(course_name):
    """Search for course logo using Google Images (placeholder)"""
    # This would require Google Custom Search API
    # For now, return common logo patterns
    search_terms = [
        f"{course_name} logo",
        f"{course_name} golf club logo", 
        f"{course_name} country club logo",
        f"{course_name} official logo"
    ]
    return search_terms

def create_fallback_logos(logo_dir):
    """Create simple text-based logos for courses without official logos"""
    from PIL import Image, ImageDraw, ImageFont
    
    for course in GOLF_COURSES:
        filename = course.lower().replace(" ", "_").replace("&", "and").replace(",", "").replace("'", "")
        filepath = os.path.join(logo_dir, f"{filename}_fallback.png")
        
        if not os.path.exists(filepath):
            try:
                # Create a simple logo with course name
                img = Image.new('RGBA', (200, 200), (0, 0, 0, 0))
                draw = ImageDraw.Draw(img)
                
                # Draw a golf ball
                draw.ellipse([75, 75, 125, 125], fill='white', outline='black', width=2)
                draw.ellipse([85, 85, 115, 115], fill='lightgray')
                
                # Add course name (truncated)
                course_short = course[:15] + "..." if len(course) > 15 else course
                try:
                    font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 12)
                except:
                    font = ImageFont.load_default()
                
                # Draw text
                text_bbox = draw.textbbox((0, 0), course_short, font=font)
                text_width = text_bbox[2] - text_bbox[0]
                text_x = (200 - text_width) // 2
                
                draw.text((text_x, 150), course_short, fill='black', font=font)
                
                img.save(filepath, 'PNG')
                print(f"✅ Created fallback logo: {filename}_fallback.png")
                
            except Exception as e:
                print(f"❌ Failed to create fallback for {course}: {e}")

def main():
    """Main function to download golf course logos"""
    print("🏌️‍♂️ Golf Course Logo Downloader")
    print("=" * 50)
    
    # Create logos directory
    logo_dir = create_logo_directory()
    
    print(f"\n📋 Found {len(GOLF_COURSES)} golf courses to process")
    
    # Download known logos
    print("\n🔍 Downloading known logos...")
    downloaded_count = 0
    
    for course, url in LOGO_SOURCES.items():
        filename = course.lower().replace(" ", "_").replace("&", "and").replace(",", "").replace("'", "")
        if download_logo(url, filename, logo_dir):
            downloaded_count += 1
        time.sleep(1)  # Be respectful to servers
    
    print(f"\n✅ Downloaded {downloaded_count} logos from known sources")
    
    # Create fallback logos for remaining courses
    print("\n🎨 Creating fallback logos for remaining courses...")
    try:
        create_fallback_logos(logo_dir)
    except ImportError:
        print("⚠️  PIL not available, skipping fallback logo creation")
        print("   Install with: pip install Pillow")
    
    # Generate SQL update script
    print("\n📝 Generating SQL update script...")
    generate_sql_update_script(logo_dir)
    
    print("\n🎯 Logo download complete!")
    print(f"📁 Logos saved to: {logo_dir}")
    print("\n⚠️  IMPORTANT: Review downloaded logos for copyright compliance")
    print("   Consider contacting courses directly for official logo usage rights")

def generate_sql_update_script(logo_dir):
    """Generate SQL script to update database with new logo URLs"""
    sql_file = "update-golf-course-logos-downloaded.sql"
    
    with open(sql_file, 'w') as f:
        f.write("-- Update Golf Course Logos with Downloaded Images\n")
        f.write("-- Run this in your Supabase SQL Editor\n\n")
        
        for course in GOLF_COURSES:
            filename = course.lower().replace(" ", "_").replace("&", "and").replace(",", "").replace("'", "")
            logo_url = f"/logos/{filename}.png"
            
            f.write(f"-- Update {course}\n")
            f.write(f"UPDATE golf_courses SET \n")
            f.write(f"    logo_url = '{logo_url}',\n")
            f.write(f"    course_image_url = '{logo_url}'\n")
            f.write(f"WHERE name = '{course}';\n\n")
        
        f.write("-- Verify updates\n")
        f.write("SELECT name, logo_url, course_image_url FROM golf_courses ORDER BY name;\n")
    
    print(f"✅ Generated SQL script: {sql_file}")

if __name__ == "__main__":
    main()
