#!/bin/bash

echo "🚀 Development Bypass Mode"
echo "=========================="
echo ""
echo "This will start your app with mock data, bypassing Supabase requirements."
echo ""

# Set temporary environment variables for development
export NEXT_PUBLIC_SUPABASE_URL="https://mock.supabase.co"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="mock-key-for-development"
export NEXT_PUBLIC_OPENWEATHER_API_KEY="mock-weather-key"

echo "✅ Environment variables set for development"
echo "🔧 Starting development server with mock data..."
echo ""

# Start the development server
npm run dev
