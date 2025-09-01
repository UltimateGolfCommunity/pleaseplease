'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface WeatherData {
  location: string
  temperature: number
  description: string
  icon: string
  humidity: number
  windSpeed: number
  feelsLike: number
}
import { 
  LogIn, 
  UserPlus, 
  Club, 
  Users, 
  Calendar, 
  Trophy, 
  Star,
  Sun,
  Wind,
  Droplets,
  Play,
  ArrowRight,
  Sparkles,
  MapPin,
  Clock,
  TrendingUp,
  User
} from 'lucide-react'


export default function HomePage() {
  const { user, profile, signOut } = useAuth()
  const router = useRouter()
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(true)

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setWeatherLoading(true)
        const response = await fetch('/api/weather?city=San Francisco')
        if (response.ok) {
          const weatherData = await response.json()
          setWeather(weatherData)
        } else {
          console.error('Failed to fetch weather:', response.statusText)
        }
      } catch (error) {
        console.error('Failed to fetch weather:', error)
      } finally {
        setWeatherLoading(false)
      }
    }

    fetchWeather()
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
      // Force page refresh to clear any cached state
      window.location.href = '/'
    } catch (error) {
      console.error('❌ Error signing out:', error)
      alert('Failed to sign out. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="relative">
                <Club className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-400 mr-2 sm:mr-3" />
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-300 absolute -top-1 -right-1" />
              </div>
              <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                <span className="hidden sm:inline">Ultimate Golf Community</span>
                <span className="sm:hidden">UGC</span>
              </span>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              {user ? (
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <div className="hidden sm:block text-sm text-gray-300">
                    Welcome, {profile?.first_name || user.email?.split('@')[0] || 'Golfer'}!
                  </div>
                  <div className="h-8 w-8 rounded-full overflow-hidden shadow-lg">
                    {profile?.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                  <a
                    href="/dashboard"
                    className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white px-2 sm:px-4 py-2 rounded-lg transition-all duration-300 shadow-lg hover:shadow-emerald-500/25 text-sm sm:text-base"
                  >
                    <span className="hidden sm:inline">Go to Dashboard</span>
                    <span className="sm:hidden">Dashboard</span>
                  </a>
                  <button
                    onClick={handleSignOut}
                    className="bg-red-600/20 hover:bg-red-600/40 text-red-400 hover:text-red-300 px-2 sm:px-4 py-2 rounded-lg transition-all duration-300 border border-red-600/30 text-sm sm:text-base"
                  >
                    <span className="hidden sm:inline">Sign Out</span>
                    <span className="sm:hidden">Out</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <a
                    href="/auth/login"
                    className="flex items-center text-gray-300 hover:text-emerald-400 transition-colors duration-300 text-sm sm:text-base"
                  >
                    <LogIn className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Sign In</span>
                    <span className="sm:hidden">In</span>
                  </a>
                  <a
                    href="/auth/signup"
                    className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white px-3 sm:px-6 py-2 rounded-lg transition-all duration-300 shadow-lg hover:shadow-emerald-500/25 text-sm sm:text-base"
                  >
                    <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 inline" />
                    <span className="hidden sm:inline">Sign Up</span>
                    <span className="sm:hidden">Up</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Video Background */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 w-full h-full">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-40"
          >
            <source src="/Firefly Have the two golfers exchanging contact information  636854.mp4" type="video/mp4" />
          </video>
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/60"></div>
        </div>
        
        {/* Hero Content */}
        <div className="relative z-10 text-center max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 sm:mb-8">
            <div className="inline-flex items-center px-3 sm:px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs sm:text-sm font-medium mb-4 sm:mb-6">
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              The Future of Golf is Here
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 sm:mb-8 leading-tight">
            <span className="text-white">Ultimate Golf</span>
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Community
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-8 sm:mb-12 max-w-4xl mx-auto leading-relaxed px-2">
            Connect with fellow golfers, book tee times, track your game, and join the most vibrant golf community online.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
            <a
              href="/explore"
              className="group bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white px-6 sm:px-10 py-3 sm:py-4 rounded-xl text-base sm:text-lg font-semibold transition-all duration-300 shadow-2xl hover:shadow-emerald-500/25 transform hover:scale-105 flex items-center w-full sm:w-auto justify-center"
            >
              <Play className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Explore Courses
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
            </a>
            <a
              href="/auth/signup"
              className="group border-2 border-emerald-400/50 text-emerald-400 hover:bg-emerald-400/10 hover:border-emerald-400 px-10 py-4 rounded-xl text-lg font-semibold transition-all duration-300 backdrop-blur-sm flex items-center"
            >
              Join Community
              <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
            </a>
          </div>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-emerald-400/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-emerald-400 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Floating Stats Section */}
      <div className="relative -mt-20 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-md border border-gray-700/50 rounded-2xl p-6 text-center transform hover:scale-105 transition-all duration-300">
              <div className="bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-emerald-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-2">10K+</div>
              <div className="text-gray-400">Active Golfers</div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-md border border-gray-700/50 rounded-2xl p-6 text-center transform hover:scale-105 transition-all duration-300">
              <div className="bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-emerald-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-2">500+</div>
              <div className="text-gray-400">Golf Courses</div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-md border border-gray-700/50 rounded-2xl p-6 text-center transform hover:scale-105 transition-all duration-300">
              <div className="bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-emerald-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-2">95%</div>
              <div className="text-gray-400">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-gradient-to-b from-gray-900 to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Everything You Need for the
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent"> Perfect Golf Experience</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              From tee time booking to community features, we've got you covered with cutting-edge technology
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="group p-8 rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 hover:border-emerald-500/50 transition-all duration-300 hover:transform hover:scale-105 backdrop-blur-sm">
              <div className="bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:from-emerald-500/30 group-hover:to-cyan-500/30 transition-all duration-300">
                <Calendar className="h-10 w-10 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3 text-center">Book Tee Times</h3>
              <p className="text-gray-400 text-center group-hover:text-gray-300 transition-colors duration-300">Easy booking for your favorite golf courses with real-time availability</p>
            </div>

            <div className="group p-8 rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 hover:border-emerald-500/50 transition-all duration-300 hover:transform hover:scale-105 backdrop-blur-sm">
              <div className="bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:from-emerald-500/30 group-hover:to-cyan-500/30 transition-all duration-300">
                <Users className="h-10 w-10 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3 text-center">Connect</h3>
              <p className="text-gray-400 text-center group-hover:text-gray-300 transition-colors duration-300">Meet and play with fellow golfers in your area</p>
            </div>

            <div className="group p-8 rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 hover:border-emerald-500/50 transition-all duration-300 hover:transform hover:scale-105 backdrop-blur-sm">
              <div className="bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:from-emerald-500/30 group-hover:to-cyan-500/30 transition-all duration-300">
                <Trophy className="h-10 w-10 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3 text-center">Track Progress</h3>
              <p className="text-gray-400 text-center group-hover:text-gray-300 transition-colors duration-300">Monitor your game improvement with detailed analytics</p>
            </div>

            <div className="group p-8 rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 hover:border-emerald-500/50 transition-all duration-300 hover:transform hover:scale-105 backdrop-blur-sm">
              <div className="bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:from-emerald-500/30 group-hover:to-cyan-500/30 transition-all duration-300">
                <Star className="h-10 w-10 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3 text-center">Reviews</h3>
              <p className="text-gray-400 text-center group-hover:text-gray-300 transition-colors duration-300">Rate and review golf courses with detailed insights</p>
            </div>
          </div>
        </div>
      </div>

      {/* Weather Widget */}
      <div className="py-24 bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Perfect Weather for
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent"> Golf</span>
            </h2>
            <p className="text-xl text-gray-400">
              Check the conditions before you hit the course
            </p>
          </div>

          {weatherLoading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-400"></div>
            </div>
          ) : weather ? (
            <div className="max-w-md mx-auto bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-2xl shadow-2xl p-8 border border-gray-700/50 backdrop-blur-sm">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-4">
                  {weather.location}
                </h3>
                <div className="flex items-center justify-center mb-6">
                  <img
                    src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                    alt={weather.description}
                    className="w-20 h-20"
                  />
                  <div className="text-left ml-6">
                    <div className="text-4xl font-bold text-white">
                      {weather.temperature}°C
                    </div>
                    <div className="text-emerald-400 capitalize text-lg">
                      {weather.description}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-6 text-sm">
                  <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-gray-800/50 border border-gray-700/50">
                    <Droplets className="h-5 w-5 text-cyan-400 mb-2" />
                    <span className="text-gray-300">{weather.humidity}%</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-gray-800/50 border border-gray-700/50">
                    <Wind className="h-5 w-5 text-gray-400 mb-2" />
                    <span className="text-gray-300">{weather.windSpeed} km/h</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-gray-800/50 border border-gray-700/50">
                    <Sun className="h-5 w-5 text-yellow-400 mb-2" />
                    <span className="text-gray-300">{weather.feelsLike}°C</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400">
              <p>Weather information unavailable</p>
            </div>
          )}
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-20 w-1 h-1 bg-cyan-400 rounded-full animate-ping"></div>
          <div className="absolute bottom-20 left-1/4 w-3 h-3 bg-emerald-300 rounded-full animate-bounce"></div>
          <div className="absolute bottom-40 right-1/3 w-1.5 h-1.5 bg-cyan-300 rounded-full animate-pulse"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 backdrop-blur-sm border border-emerald-500/20 rounded-3xl p-12">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-8">
              Ready to Transform Your
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent"> Golf Experience</span>?
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              Join thousands of golfers who are already part of the Ultimate Golf Community and discover a new way to enjoy the game
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <a
                href="/auth/signup"
                className="group bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 hover:from-emerald-600 hover:via-cyan-600 hover:to-blue-600 text-white px-16 py-6 rounded-2xl text-2xl font-bold transition-all duration-500 shadow-2xl hover:shadow-emerald-500/50 transform hover:scale-110 inline-flex items-center relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <span className="relative">Get Started Today</span>
                <ArrowRight className="h-7 w-7 ml-4 group-hover:translate-x-2 transition-transform duration-300 relative" />
              </a>
              <a
                href="/dashboard"
                className="group border-2 border-emerald-400/50 text-emerald-400 hover:bg-emerald-400/10 hover:border-emerald-400 px-16 py-6 rounded-2xl text-2xl font-bold transition-all duration-500 backdrop-blur-sm flex items-center"
              >
                Explore Dashboard
                <ArrowRight className="h-7 w-7 ml-4 group-hover:translate-x-2 transition-transform duration-300" />
              </a>
            </div>
          </div>
        </div>
      </div>
      

    </div>
  )
}
