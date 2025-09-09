#!/usr/bin/env python3
"""
Simple text-based logo generator for golf courses
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_text_logo(course_name, output_path):
    """Create a simple text-based logo"""
    try:
        # Create image
        img = Image.new('RGBA', (200, 200), (255, 255, 255, 0))
        draw = ImageDraw.Draw(img)
        
        # Draw golf ball
        draw.ellipse([50, 50, 150, 150], fill='white', outline='black', width=3)
        draw.ellipse([70, 70, 130, 130], fill='lightgray')
        draw.ellipse([90, 90, 110, 110], fill='darkgray')
        
        # Add course name
        course_short = course_name[:12] + "..." if len(course_name) > 12 else course_name
        
        try:
            font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 14)
        except:
            font = ImageFont.load_default()
        
        # Draw text
        text_bbox = draw.textbbox((0, 0), course_short, font=font)
        text_width = text_bbox[2] - text_bbox[0]
        text_x = (200 - text_width) // 2
        
        draw.text((text_x, 160), course_short, fill='black', font=font)
        
        img.save(output_path, 'PNG')
        print(f"✅ Created: {output_path}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to create {output_path}: {e}")
        return False

# Golf courses to create logos for
courses = [
    "The Honors Course",
    "Woodmont Golf & Country Club", 
    "The Club at Lake Arrowhead",
    "Hermitage Golf Course",
    "Gaylord Springs Golf Links",
    "Augusta National Golf Club",
    "Pebble Beach Golf Links",
    "Torrey Pines Golf Course"
]

# Create logos directory
os.makedirs("public/logos", exist_ok=True)

# Generate logos
for course in courses:
    filename = course.lower().replace(" ", "_").replace("&", "and").replace(",", "").replace("'", "")
    output_path = f"public/logos/{filename}_text_logo.png"
    create_text_logo(course, output_path)

print("\n🎯 Text logo generation complete!")
