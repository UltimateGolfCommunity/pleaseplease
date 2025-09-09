#!/usr/bin/env python3
"""
Course Logo Scraper
This script helps you find and download course logos from their websites.
"""

import requests
from bs4 import BeautifulSoup
import os
from urllib.parse import urljoin, urlparse
import time

def get_course_logo(course_name, website_url):
    """
    Attempt to find and download a course logo from their website.
    """
    try:
        print(f"🔍 Searching for {course_name} logo...")
        
        # Headers to mimic a real browser
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        # Get the website content
        response = requests.get(website_url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Look for common logo patterns
        logo_selectors = [
            'img[alt*="logo" i]',
            'img[alt*="golf" i]',
            'img[alt*="club" i]',
            'img[alt*="course" i]',
            '.logo img',
            '.header img',
            '.navbar img',
            '.brand img',
            'img[src*="logo" i]',
            'img[src*="golf" i]',
            'img[src*="club" i]'
        ]
        
        logo_found = False
        for selector in logo_selectors:
            logos = soup.select(selector)
            for logo in logos:
                src = logo.get('src')
                if src:
                    # Convert relative URL to absolute
                    logo_url = urljoin(website_url, src)
                    
                    # Check if it looks like a logo (common patterns)
                    if any(pattern in logo_url.lower() for pattern in ['logo', 'golf', 'club', 'course']):
                        print(f"✅ Found potential logo: {logo_url}")
                        
                        # Download the logo
                        logo_response = requests.get(logo_url, headers=headers, timeout=10)
                        if logo_response.status_code == 200:
                            # Create filename
                            filename = f"{course_name.lower().replace(' ', '-').replace('&', 'and')}-logo.png"
                            
                            # Save the logo
                            with open(filename, 'wb') as f:
                                f.write(logo_response.content)
                            
                            print(f"💾 Saved logo as: {filename}")
                            logo_found = True
                            break
            
            if logo_found:
                break
        
        if not logo_found:
            print(f"❌ No logo found for {course_name}")
            return None
            
    except Exception as e:
        print(f"❌ Error getting logo for {course_name}: {str(e)}")
        return None

def main():
    """
    Main function to get logos for multiple courses.
    """
    # Course information
    courses = [
        {
            "name": "Canton Golf Club",
            "website": "https://www.cantongolfclub.com"
        },
        {
            "name": "The Grove",
            "website": "https://www.thegrove.com"
        },
        {
            "name": "Vanderbilt Legends Club",
            "website": "https://www.vanderbiltlegends.com"
        },
        {
            "name": "Tennessee National Golf Club",
            "website": "https://www.tennesseenational.com"
        },
        {
            "name": "The Club at Lake Arrowhead",
            "website": "https://www.lakearrowheadclub.com"
        }
    ]
    
    print("🏌️ Course Logo Scraper")
    print("=" * 50)
    
    # Create logos directory
    os.makedirs("course-logos", exist_ok=True)
    os.chdir("course-logos")
    
    for course in courses:
        print(f"\n🎯 Processing: {course['name']}")
        get_course_logo(course['name'], course['website'])
        time.sleep(2)  # Be respectful to the websites
    
    print("\n✅ Logo scraping complete!")
    print("📁 Check the 'course-logos' directory for downloaded files")
    print("🚀 Upload these to your Supabase storage bucket")

if __name__ == "__main__":
    main()
