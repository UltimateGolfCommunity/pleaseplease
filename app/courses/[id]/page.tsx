'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import { 
  MapPin, 
  Star, 
  Flag, 
  Target, 
  Phone, 
  Globe, 
  Mail, 
  Clock,
  DollarSign,
  Car,
  Utensils,
  ShoppingBag,
  Dumbbell,
  GraduationCap,
  ArrowLeft,
  Camera,
  Share2,
  Heart,
  Calendar
} from 'lucide-react'
import Link from 'next/link'

interface CourseDetails {
  id: string
  name: string
  location: string
  description: string
  par: number
  holes: number
  average_rating: number
  review_count: number
  course_image_url: string
  logo_url: string
  website_url: string
  phone: string
  address: string
  city: string
  state: string
  zip_code: string
  country: string
  latitude: number
  longitude: number
  course_type: string
  green_fees_min: number
  green_fees_max: number
  cart_fees: number
  caddie_available: boolean
  pro_shop: boolean
  restaurant: boolean
  driving_range: boolean
  putting_green: boolean
  practice_facilities: boolean
  lessons_available: boolean
  dress_code: string
  is_featured: boolean
  is_active: boolean
}

export default function CourseDetailsPage() {
  const params = useParams()
  const courseId = params.id as string
  const [course, setCourse] = useState<CourseDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const supabase = createBrowserClient()

  useEffect(() => {
    if (courseId) {
      fetchCourseDetails()
    }
  }, [courseId])

  const fetchCourseDetails = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('golf_courses')
        .select('*')
        .eq('id', courseId)
        .single()

      if (error) throw error
      setCourse(data)
    } catch (err) {
      console.error('Error fetching course details:', err)
      setError('Failed to load course details')
    } finally {
      setLoading(false)
    }
  }

  const handleFavorite = () => {
    setIsFavorite(!isFavorite)
    // TODO: Implement favorite functionality
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: course?.name,
        text: `Check out ${course?.name} golf course`,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading course details...</p>
        </div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-white text-2xl font-bold mb-4">Course Not Found</h1>
          <p className="text-slate-300 mb-6">The course you're looking for doesn't exist or has been removed.</p>
          <Link 
            href="/dashboard?tab=courses"
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Back to Courses
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard?tab=courses"
                className="text-slate-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <h1 className="text-white text-xl font-bold">{course.name}</h1>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleFavorite}
                className={`p-2 rounded-lg transition-colors ${
                  isFavorite 
                    ? 'bg-red-500 text-white' 
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={handleShare}
                className="p-2 bg-slate-700 text-slate-300 hover:bg-slate-600 rounded-lg transition-colors"
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Course Hero Section */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl mb-8">
          {/* Course Image */}
          <div className="relative h-64 sm:h-80 lg:h-96">
            {course.course_image_url ? (
              <img
                src={course.course_image_url}
                alt={course.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Flag className="h-24 w-24 text-white" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            
            {/* Course Logo */}
            {course.logo_url && (
              <div className="absolute top-6 left-6">
                <div className="h-20 w-20 bg-white/90 rounded-xl p-3 shadow-lg">
                  <img
                    src={course.logo_url}
                    alt={`${course.name} logo`}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Course Type Badge */}
            <div className="absolute top-6 right-6">
              <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                course.course_type === 'private' 
                  ? 'bg-red-500/90 text-white' 
                  : course.course_type === 'public'
                  ? 'bg-green-500/90 text-white'
                  : 'bg-blue-500/90 text-white'
              }`}>
                {course.course_type === 'private' ? 'Private' : 
                 course.course_type === 'public' ? 'Public' : 
                 course.course_type === 'municipal' ? 'Municipal' : 'Resort'}
              </div>
            </div>

            {/* Rating Badge */}
            <div className="absolute bottom-6 right-6">
              <div className="bg-emerald-500/90 backdrop-blur-sm rounded-xl px-4 py-3 text-center shadow-lg">
                <div className="flex items-center space-x-1 mb-1">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <span className="text-white font-bold text-xl">{course.average_rating}</span>
                </div>
                <div className="text-emerald-100 text-xs">
                  {course.review_count} reviews
                </div>
              </div>
            </div>
          </div>

          {/* Course Info */}
          <div className="p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6">
              <div className="flex-1">
                <h1 className="text-white font-bold text-3xl lg:text-4xl mb-4">{course.name}</h1>
                <div className="flex items-center space-x-4 text-slate-300 text-lg mb-4">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-emerald-400" />
                    <span>{course.location}</span>
                  </div>
                </div>
                <p className="text-slate-200 text-lg leading-relaxed mb-6">{course.description}</p>
              </div>
            </div>

            {/* Course Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-slate-700/30 rounded-lg p-4 text-center">
                <Flag className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                <div className="text-slate-400 text-sm uppercase tracking-wide mb-1">Par</div>
                <div className="text-white font-bold text-2xl">{course.par}</div>
              </div>
              <div className="bg-slate-700/30 rounded-lg p-4 text-center">
                <Target className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                <div className="text-slate-400 text-sm uppercase tracking-wide mb-1">Holes</div>
                <div className="text-white font-bold text-2xl">{course.holes}</div>
              </div>
              <div className="bg-slate-700/30 rounded-lg p-4 text-center">
                <Star className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
                <div className="text-slate-400 text-sm uppercase tracking-wide mb-1">Rating</div>
                <div className="text-white font-bold text-2xl">{course.average_rating}</div>
              </div>
              <div className="bg-slate-700/30 rounded-lg p-4 text-center">
                <DollarSign className="h-6 w-6 text-green-400 mx-auto mb-2" />
                <div className="text-slate-400 text-sm uppercase tracking-wide mb-1">Green Fees</div>
                <div className="text-white font-bold text-lg">
                  {course.green_fees_min > 0 ? `$${course.green_fees_min}-${course.green_fees_max}` : 'Members Only'}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-slate-700/30 rounded-lg p-6">
                <h3 className="text-white font-semibold text-lg mb-4">Contact Information</h3>
                <div className="space-y-3">
                  {course.phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-emerald-400" />
                      <span className="text-slate-300">{course.phone}</span>
                    </div>
                  )}
                  {course.website_url && (
                    <div className="flex items-center space-x-3">
                      <Globe className="h-5 w-5 text-emerald-400" />
                      <a 
                        href={course.website_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                  {course.address && (
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-5 w-5 text-emerald-400 mt-1" />
                      <div className="text-slate-300">
                        <div>{course.address}</div>
                        {course.city && course.state && (
                          <div>{course.city}, {course.state} {course.zip_code}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-700/30 rounded-lg p-6">
                <h3 className="text-white font-semibold text-lg mb-4">Course Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Course Type:</span>
                    <span className="text-white font-medium capitalize">{course.course_type}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Cart Fees:</span>
                    <span className="text-white font-medium">
                      {course.cart_fees > 0 ? `$${course.cart_fees}` : 'Included'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Caddie Available:</span>
                    <span className="text-white font-medium">
                      {course.caddie_available ? 'Yes' : 'No'}
                    </span>
                  </div>
                  {course.dress_code && (
                    <div className="flex items-start justify-between">
                      <span className="text-slate-400">Dress Code:</span>
                      <span className="text-white font-medium text-right">{course.dress_code}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div className="bg-slate-700/30 rounded-lg p-6">
              <h3 className="text-white font-semibold text-lg mb-4">Amenities & Facilities</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {course.pro_shop && (
                  <div className="flex items-center space-x-2">
                    <ShoppingBag className="h-5 w-5 text-emerald-400" />
                    <span className="text-slate-300">Pro Shop</span>
                  </div>
                )}
                {course.restaurant && (
                  <div className="flex items-center space-x-2">
                    <Utensils className="h-5 w-5 text-emerald-400" />
                    <span className="text-slate-300">Restaurant</span>
                  </div>
                )}
                {course.driving_range && (
                  <div className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-emerald-400" />
                    <span className="text-slate-300">Driving Range</span>
                  </div>
                )}
                {course.putting_green && (
                  <div className="flex items-center space-x-2">
                    <Flag className="h-5 w-5 text-emerald-400" />
                    <span className="text-slate-300">Putting Green</span>
                  </div>
                )}
                {course.practice_facilities && (
                  <div className="flex items-center space-x-2">
                    <Dumbbell className="h-5 w-5 text-emerald-400" />
                    <span className="text-slate-300">Practice Facilities</span>
                  </div>
                )}
                {course.lessons_available && (
                  <div className="flex items-center space-x-2">
                    <GraduationCap className="h-5 w-5 text-emerald-400" />
                    <span className="text-slate-300">Lessons Available</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Book Tee Time</span>
          </button>
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2">
            <Star className="h-5 w-5" />
            <span>Write Review</span>
          </button>
          <button className="bg-slate-600 hover:bg-slate-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2">
            <Share2 className="h-5 w-5" />
            <span>Share Course</span>
          </button>
        </div>
      </div>
    </div>
  )
}
