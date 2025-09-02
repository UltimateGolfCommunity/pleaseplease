import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const city = searchParams.get('city')
  const lat = searchParams.get('lat')
  const lon = searchParams.get('lon')
  
  // Check if we have a valid OpenWeather API key
  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || '4f47bb853251d4df07d4e8d8c178c77f'
  const hasValidApiKey = apiKey && 
                        !apiKey.includes('your_openweather_api_key_here') && 
                        apiKey.length > 10
  
  // If no valid API key is configured, use mock data for development
  if (!hasValidApiKey) {
    console.log('⚠️  Invalid or placeholder OpenWeather API key. Using mock data for development.')
    
    // Return mock weather data for development
    const mockWeatherData = {
      location: city || 'Monterey',
      temperature: 72,
      description: 'partly cloudy',
      icon: '02d',
      humidity: 65,
      windSpeed: 8,
      feelsLike: 74
    }
    
    return NextResponse.json(mockWeatherData)
  }
  
  try {
    let response: Response
    
    // If coordinates are provided, use them (more accurate)
    if (lat && lon) {
      response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`
      )
    } else {
      // Use city name (fallback)
      const cityName = city || 'Monterey'
      
      // Try different city formats if the first one fails
      response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityName)}&appid=${apiKey}&units=imperial`
      )
      
      // If city not found, try without state/country
      if (response.status === 404) {
        const cityOnly = cityName.split(',')[0].trim()
        response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityOnly)}&appid=${apiKey}&units=imperial`
        )
      }
    }

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`)
    }

    const data = await response.json()

    const weatherData = {
      location: data.name,
      temperature: Math.round(data.main.temp),
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
      feelsLike: Math.round(data.main.feels_like)
    }

    return NextResponse.json(weatherData)
  } catch (error) {
    console.error('Error fetching weather data:', error)
    
    // Return mock data on error for development
    const mockWeatherData = {
      location: city || 'Monterey',
      temperature: 72,
      description: 'partly cloudy',
      icon: '02d',
      humidity: 65,
      windSpeed: 8,
      feelsLike: 74
    }
    
    return NextResponse.json(mockWeatherData)
  }
}
