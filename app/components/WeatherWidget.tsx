'use client'

import { useState, useEffect, useCallback } from 'react'
import { Cloud, Sun, CloudRain, CloudSnow, Wind, MapPin, Droplets } from 'lucide-react'

interface WeatherData {
  location: string
  temperature: number
  description: string
  icon: string
  humidity: number
  windSpeed: number
  feelsLike: number
}

interface WeatherWidgetProps {
  className?: string
}

export default function WeatherWidget({ className = '' }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [location, setLocation] = useState<string>('Detecting location...') // Will be updated with current location
  const [coordinates, setCoordinates] = useState<{lat: number, lon: number} | null>(null)

  const getCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setCoordinates({ lat: latitude, lon: longitude })
          setLocation('Current Location')
          // Fetch weather using coordinates
          fetchWeatherByCoordinates(latitude, longitude)
        },
        (error) => {
          console.error('Geolocation error:', error)
          setLocation('Monterey') // Fallback to default location
          fetchWeather()
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      )
    } else {
      setLocation('Monterey') // Fallback for browsers without geolocation
      fetchWeather()
    }
  }, [])

  const fetchWeatherByCoordinates = useCallback(async (lat: number, lon: number) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/weather?lat=${lat}&lon=${lon}`)
      if (!response.ok) {
        throw new Error('Failed to fetch weather data')
      }
      
      const data = await response.json()
      setWeather(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weather')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchWeather = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/weather?city=${encodeURIComponent(location)}`)
      if (!response.ok) {
        throw new Error('Failed to fetch weather data')
      }
      
      const data = await response.json()
      setWeather(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weather')
    } finally {
      setLoading(false)
    }
  }, [location])

  useEffect(() => {
    getCurrentLocation()
  }, [getCurrentLocation])

  const getWeatherIcon = (description: string) => {
    const desc = description.toLowerCase()
    if (desc.includes('clear') || desc.includes('sun')) {
      return <Sun className="w-6 h-6 text-yellow-500" />
    } else if (desc.includes('cloud')) {
      return <Cloud className="w-6 h-6 text-gray-500" />
    } else if (desc.includes('rain') || desc.includes('drizzle')) {
      return <CloudRain className="w-6 h-6 text-blue-500" />
    } else if (desc.includes('snow')) {
      return <CloudSnow className="w-6 h-6 text-blue-400" />
    } else if (desc.includes('thunder')) {
      return <CloudRain className="w-6 h-6 text-purple-500" />
    } else {
      return <Sun className="w-6 h-6 text-yellow-500" />
    }
  }

  const getGolfRecommendation = (weather: WeatherData) => {
    const temp = weather.temperature
    const windSpeed = weather.windSpeed
    const description = weather.description.toLowerCase()

    if (description.includes('rain') || description.includes('snow') || description.includes('thunder')) {
      return 'Not ideal for golf - consider indoor practice'
    }
    
    if (windSpeed > 20) {
      return 'High winds - challenging conditions'
    }
    
    if (temp < 50) {
      return 'Cold weather - dress warmly'
    }
    
    if (temp > 85) {
      return 'Hot weather - stay hydrated'
    }
    
    return 'Great conditions for golf!'
  }

  const formatTemperature = (temp: number) => {
    return `${Math.round(temp)}°F`
  }

  const formatWindSpeed = (speed: number) => {
    return `${Math.round(speed)} mph`
  }



  if (loading) {
    return (
      <div className={`bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-xl shadow-sm p-4 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
          <span className="ml-3 text-gray-600 text-sm">Loading weather...</span>
        </div>
      </div>
    )
  }

  if (error || !weather) {
    return (
      <div className={`bg-white/95 backdrop-blur-sm border border-red-200/50 rounded-xl shadow-sm p-4 ${className}`}>
        <div className="text-center">
          <Cloud className="w-6 h-6 text-red-500 mx-auto mb-2" />
          <p className="text-gray-800 font-medium text-sm">Weather Unavailable</p>
          <button
            onClick={fetchWeather}
            className="mt-2 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors text-sm border border-red-200"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-xl shadow-sm p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-gray-500" />
          <h3 className="text-gray-900 font-medium text-sm">{weather.location}</h3>
        </div>
        <button
          onClick={fetchWeather}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Main Weather Display */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {getWeatherIcon(weather.description)}
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {formatTemperature(weather.temperature)}
            </div>
            <div className="text-gray-500 text-xs capitalize">
              {weather.description}
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-gray-400 text-xs">Feels like</div>
          <div className="text-gray-700 font-medium text-sm">
            {formatTemperature(weather.feelsLike)}
          </div>
        </div>
      </div>

      {/* Weather Details - Compact */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-2">
          <Wind className="w-3.5 h-3.5 text-gray-500" />
          <div>
            <div className="text-gray-400 text-xs">Wind</div>
            <div className="text-gray-700 font-medium text-xs">{formatWindSpeed(weather.windSpeed)}</div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-2">
          <Droplets className="w-3.5 h-3.5 text-gray-500" />
          <div>
            <div className="text-gray-400 text-xs">Humidity</div>
            <div className="text-gray-700 font-medium text-xs">{weather.humidity}%</div>
          </div>
        </div>
      </div>

      {/* Golf Recommendation - Compact */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="flex items-center space-x-2 mb-1">
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-green-700 font-medium text-xs">Golf Conditions</span>
        </div>
        <p className="text-green-600 text-xs">{getGolfRecommendation(weather)}</p>
      </div>
    </div>
  )
}
