#!/bin/bash

echo "🏌️‍♂️ Ultimate Golf Community - Environment Setup"
echo "================================================"
echo ""

# Check if .env.local already exists
if [ -f ".env.local" ]; then
    echo "⚠️  .env.local already exists. Backing up to .env.local.backup"
    cp .env.local .env.local.backup
fi

# Create .env.local file
echo "Creating .env.local file..."
cat > .env.local << 'EOF'
# Supabase Configuration
# Get these values from your Supabase project dashboard
# https://supabase.com/dashboard/project/_/settings/api
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# OpenWeather API Key (optional - has fallback)
# Get from: https://openweathermap.org/api
NEXT_PUBLIC_OPENWEATHER_API_KEY=your_openweather_api_key_here

# Example values (replace with your actual values):
# NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EOF

echo "✅ .env.local file created successfully!"
echo ""
echo "🔧 Next steps:"
echo "1. Edit .env.local and add your actual Supabase credentials"
echo "2. Get your credentials from: https://supabase.com/dashboard/project/_/settings/api"
echo "3. Run 'npm run dev' to start the development server"
echo ""
echo "📝 Note: .env.local is already in .gitignore and won't be committed to Git"
