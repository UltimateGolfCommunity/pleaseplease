'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import Logo from '@/app/components/Logo'
import ThemeToggle from '@/app/components/ThemeToggle'
import { ArrowLeft, MapPin, Users, Heart } from 'lucide-react'

export default function AboutPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // No authentication required - anyone can view the About page

  return (
    <div className="min-h-screen bg-theme-gradient transition-colors duration-300">
      {/* Header */}
      <header className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-b border-gray-200/60 dark:border-slate-700/60 sticky top-0 z-50 shadow-xl transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 sm:h-24">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/dashboard">
                <Logo size="lg" />
              </Link>
            </div>

            {/* Navigation */}
            <div className="flex items-center space-x-4">
              {user ? (
                <Link
                  href="/dashboard"
                  className="flex items-center space-x-2 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-300"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span className="font-medium">Back to Dashboard</span>
                </Link>
              ) : (
                <Link
                  href="/"
                  className="flex items-center space-x-2 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-300"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span className="font-medium">Back to Home</span>
                </Link>
              )}
              
              <ThemeToggle size="sm" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="space-y-8">
          {/* Page Header */}
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent mb-4">
              About Us
            </h1>
            <p className="text-lg text-gray-600 dark:text-slate-300 max-w-2xl mx-auto">
              Building connections through the game we love, one round at a time.
            </p>
          </div>

          {/* Leadership Team */}
          <div className="space-y-8">
            {/* Founder Section */}
            <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border border-gray-200/50 dark:border-slate-700/50 rounded-3xl p-8 sm:p-12 shadow-xl">
              <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
                {/* Founder Photo */}
                <div className="flex-shrink-0">
                  <div className="relative">
                    <img
                      src="/founder-photo.jpeg"
                      alt="Todd Phillips - Founder"
                      className="w-64 h-64 sm:w-80 sm:h-80 rounded-2xl object-cover shadow-2xl border-4 border-emerald-500/20"
                    />
                    <div className="absolute -bottom-4 -right-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-2 rounded-xl shadow-lg">
                      <span className="font-semibold text-sm">Our Founder</span>
                    </div>
                  </div>
                </div>

                {/* Founder Story */}
                <div className="flex-1 space-y-6">
                  <div>
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                      Todd Phillips
                    </h2>
                    <p className="text-xl text-emerald-600 dark:text-emerald-400 font-medium">
                      Founder & CEO
                    </p>
                  </div>

                  <div className="space-y-4 text-gray-700 dark:text-slate-300 leading-relaxed">
                    <p className="text-lg">
                      Todd's journey into golf began like many others - showing up at a municipal golf course, 
                      getting paired with strangers, and hoping for the best. What he discovered was something 
                      magical: the power of golf to bring people together.
                    </p>
                    
                    <p className="text-lg">
                      Through countless rounds with random playing partners, Todd built a network of friends 
                      that would become some of his closest relationships. These weren't just golf buddies - 
                      they became lifelong friends, business partners, and even family.
                    </p>
                    
                    <p className="text-lg">
                      This experience inspired him to create Ultimate Golf Community, a platform that makes 
                      it easier for golfers to connect, find playing partners, and build meaningful relationships 
                      through the game we all love.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* CFO Section */}
            <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border border-gray-200/50 dark:border-slate-700/50 rounded-3xl p-8 sm:p-12 shadow-xl">
              <div className="flex flex-col lg:flex-row-reverse items-center gap-8 lg:gap-12">
                {/* CFO Photo */}
                <div className="flex-shrink-0">
                  <div className="relative">
                    <img
                      src="/cfo-photo.jpeg"
                      alt="Carden Ridge - CFO"
                      className="w-64 h-64 sm:w-80 sm:h-80 rounded-2xl object-cover shadow-2xl border-4 border-blue-500/20"
                    />
                    <div className="absolute -bottom-4 -right-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl shadow-lg">
                      <span className="font-semibold text-sm">Our CFO</span>
                    </div>
                  </div>
                </div>

                {/* CFO Story */}
                <div className="flex-1 space-y-6">
                  <div>
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                      Carden Ridge
                    </h2>
                    <p className="text-xl text-blue-600 dark:text-blue-400 font-medium">
                      Chief Financial Officer
                    </p>
                  </div>

                  <div className="space-y-4 text-gray-700 dark:text-slate-300 leading-relaxed">
                    <p className="text-lg">
                      Carden brings a wealth of financial expertise and strategic vision to Ultimate Golf Community. 
                      With a deep understanding of both traditional finance and emerging technology markets, 
                      Carden ensures our platform remains financially sound while scaling to serve golfers worldwide.
                    </p>
                    
                    <p className="text-lg">
                      His passion for golf and commitment to building sustainable business models makes him 
                      the perfect partner in our mission to revolutionize how golfers connect and play together. 
                      Carden's strategic thinking helps us balance growth with the community values that make 
                      our platform special.
                    </p>
                    
                    <p className="text-lg">
                      Under Carden's financial leadership, Ultimate Golf Community is positioned to become 
                      the premier destination for golfers seeking meaningful connections and memorable experiences 
                      on and off the course.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Values */}
            <div className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 backdrop-blur-sm border border-emerald-200/50 dark:border-emerald-700/50 rounded-3xl p-8 sm:p-12 shadow-xl">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
                Our Core Values
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                  <MapPin className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Community</h3>
                  <p className="text-gray-600 dark:text-slate-400">
                    Building connections through shared experiences and mutual respect
                  </p>
                </div>
                
                <div className="text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <Users className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Inclusivity</h3>
                  <p className="text-gray-600 dark:text-slate-400">
                    Welcoming golfers of all skill levels, backgrounds, and experiences
                  </p>
                </div>
                
                <div className="text-center p-6 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                  <Heart className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Passion</h3>
                  <p className="text-gray-600 dark:text-slate-400">
                    Fueled by love for the game and dedication to our community
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Mission Statement */}
          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 backdrop-blur-sm border border-emerald-200/50 dark:border-emerald-700/50 rounded-3xl p-8 sm:p-12 shadow-xl">
            <div className="text-center space-y-6">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                Our Mission
              </h2>
              
              <p className="text-xl text-gray-700 dark:text-slate-300 leading-relaxed max-w-3xl mx-auto">
                To create a platform where golfers can easily find playing partners, discover new courses, 
                and build lasting friendships through the shared love of golf. We believe that every round 
                is an opportunity to make a new friend, and every friend is just one tee time away.
              </p>
              
              <div className="pt-6">
                {user ? (
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-8 py-4 rounded-2xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  >
                    <span>Go to Dashboard</span>
                    <ArrowLeft className="h-5 w-5 rotate-180" />
                  </Link>
                ) : (
                  <Link
                    href="/auth/signup"
                    className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-8 py-4 rounded-2xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  >
                    <span>Join Our Community</span>
                    <ArrowLeft className="h-5 w-5 rotate-180" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
