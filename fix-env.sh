#!/bin/bash

# Fix Supabase Environment Variables
echo "🔧 Fixing Supabase environment variables..."

# Backup current .env.local
if [ -f .env.local ]; then
    cp .env.local .env.local.backup
    echo "✅ Backed up current .env.local to .env.local.backup"
fi

# Create new .env.local with real credentials
cat > .env.local << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xnuokgscavnytpqxlurg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhudW9rZ3NjYXZueXRwcXhsdXJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwOTcyMjMsImV4cCI6MjA3MDY3MzIyM30.a3vgfoRo2ZsoQeoD-5PdqWsmAxxYSLXpIhzpVNr0I6M

# OpenWeather API Key (optional - has fallback)
NEXT_PUBLIC_OPENWEATHER_API_KEY=your_openweather_api_key_here
EOF

echo "✅ Created new .env.local with real Supabase credentials"
echo "🔍 New .env.local contents:"
echo "----------------------------------------"
cat .env.local
echo "----------------------------------------"
echo ""
echo "🚀 Now restart your development server with: npm run dev"
echo "🎯 The Supabase integration should work properly now!"
