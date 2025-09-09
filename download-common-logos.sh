#!/bin/bash

echo "🏌️‍♂️ Downloading Common Golf Course Logos"
echo "=========================================="

# Create logos directory
mkdir -p public/logos

echo "📁 Created logos directory: public/logos"
echo ""

# Function to download logo
download_logo() {
    local url="$1"
    local filename="$2"
    local description="$3"
    
    echo "🔍 Downloading: $description"
    
    if curl -s -o "public/logos/$filename" "$url"; then
        echo "✅ Downloaded: $filename"
    else
        echo "❌ Failed to download: $filename"
    fi
    echo ""
}

# Download some common golf course logos
# Note: These are example URLs - you'll need to find actual logo URLs

echo "📥 Downloading famous course logos..."
echo ""

# Augusta National (example - you'll need to find the actual logo URL)
# download_logo "https://example.com/augusta-logo.png" "augusta_national_golf_club.png" "Augusta National Golf Club"

# Pebble Beach (example)
# download_logo "https://example.com/pebble-beach-logo.png" "pebble_beach_golf_links.png" "Pebble Beach Golf Links"

# Torrey Pines (example)
# download_logo "https://example.com/torrey-pines-logo.png" "torrey_pines_golf_course.png" "Torrey Pines Golf Course"

echo "⚠️  Note: Logo URLs need to be found manually"
echo "   See 'find-golf-logos.md' for detailed instructions"
echo ""

# Create a simple generic golf logo as fallback
echo "🎨 Creating generic golf logo fallback..."

# Create a simple SVG golf ball logo
cat > public/logos/generic_golf_logo.svg << 'EOF'
<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <circle cx="100" cy="100" r="80" fill="white" stroke="#333" stroke-width="2"/>
  <circle cx="100" cy="100" r="60" fill="#f0f0f0"/>
  <circle cx="100" cy="100" r="40" fill="#e0e0e0"/>
  <circle cx="100" cy="100" r="20" fill="#d0d0d0"/>
  <text x="100" y="150" text-anchor="middle" font-family="Arial" font-size="12" fill="#333">GOLF</text>
</svg>
EOF

echo "✅ Created generic golf logo: public/logos/generic_golf_logo.svg"
echo ""

# Create a simple text-based logo generator
echo "📝 Creating logo generator script..."

cat > generate_text_logos.py << 'EOF'
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
EOF

chmod +x generate_text_logos.py

echo "✅ Created logo generator: generate_text_logos.py"
echo ""

# Run the logo generator
echo "🎨 Generating text-based logos..."
python3 generate_text_logos.py

echo ""
echo "🎯 Logo download process complete!"
echo ""
echo "📁 Check the public/logos/ directory for downloaded logos"
echo "📝 See find-golf-logos.md for detailed manual logo collection"
echo ""
echo "⚠️  Remember to:"
echo "   - Verify copyright compliance"
echo "   - Contact courses for official logos when possible"
echo "   - Update database with new logo URLs"
echo "   - Test logo display in your application"
