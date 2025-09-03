'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { 
  MapPin, 
  Star, 
  Plus, 
  Search, 
  Edit,
  Users,
  Calendar,
  MessageSquare,
  Flag,
  Award,
  ChevronDown,
  ChevronUp,
  Send
} from 'lucide-react'

interface Review {
  id: string
  rating: number
  comment: string
  created_at: string
  user_profiles: {
    first_name: string
    last_name: string
    avatar_url?: string
  }
}

interface GolfCourse {
  id: string
  name: string
  location: string
  description?: string
  par?: number
  holes: number
  average_rating: number
  review_count: number
  recent_reviews: Review[]
  course_reviews: Review[]
}

export default function GolfCourseSystem() {
  const { user: currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState<'browse' | 'create' | 'reviews'>('browse')
  const [courses, setCourses] = useState<GolfCourse[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<GolfCourse | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null)

  // Create course form state
  const [createForm, setCreateForm] = useState({
    name: '',
    location: '',
    description: '',
    par: '',
    holes: '18'
  })

  // Review form state
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: ''
  })
  const [showReviewForm, setShowReviewForm] = useState<string | null>(null)

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async (query?: string) => {
    try {
      setLoading(true)
      const url = query 
        ? `/api/golf-courses?query=${encodeURIComponent(query)}&limit=50`
        : '/api/golf-courses?limit=50'
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (response.ok) {
        setCourses(data.courses || [])
      } else {
        console.error('Error fetching courses:', data.error)
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query.trim()) {
      fetchCourses(query)
    } else {
      fetchCourses()
    }
  }

  const createCourse = async () => {
    if (!createForm.name.trim() || !createForm.location.trim()) {
      alert('Please fill in name and location')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/golf-courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createForm.name,
          location: createForm.location,
          description: createForm.description || null,
          par: createForm.par ? parseInt(createForm.par) : null,
          holes: parseInt(createForm.holes)
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert('Golf course created successfully!')
        setCreateForm({
          name: '',
          location: '',
          description: '',
          par: '',
          holes: '18'
        })
        setShowCreateForm(false)
        fetchCourses()
      } else {
        alert('Error creating course: ' + data.error)
      }
    } catch (error) {
      console.error('Error creating course:', error)
      alert('Failed to create course')
    } finally {
      setLoading(false)
    }
  }

  const submitReview = async (courseId: string) => {
    if (!currentUser?.id) {
      alert('Please log in to submit a review')
      return
    }

    if (!reviewForm.comment.trim()) {
      alert('Please write a comment')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/golf-courses/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: courseId,
          user_id: currentUser.id,
          rating: reviewForm.rating,
          comment: reviewForm.comment
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert('Review submitted successfully!')
        setReviewForm({ rating: 5, comment: '' })
        setShowReviewForm(null)
        fetchCourses() // Refresh to show updated reviews
      } else {
        alert('Error submitting review: ' + data.error)
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      alert('Failed to submit review')
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (rating: number, interactive = false, onRate?: (rating: number) => void) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating 
                ? 'text-yellow-400 fill-current' 
                : 'text-gray-400'
            } ${interactive ? 'cursor-pointer hover:text-yellow-300' : ''}`}
            onClick={() => interactive && onRate && onRate(star)}
          />
        ))}
      </div>
    )
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const reviewTime = new Date(timestamp)
    const diffInMs = now.getTime() - reviewTime.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInDays < 1) return 'Today'
    if (diffInDays < 7) return `${diffInDays}d ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`
    return `${Math.floor(diffInDays / 30)}mo ago`
  }

  return (
    <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <Flag className="h-6 w-6 mr-2 text-emerald-400" />
          Golf Courses
        </h2>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'browse'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/30'
                : 'bg-gray-600/20 text-gray-300 hover:bg-gray-600/30'
            }`}
          >
            <Search className="h-4 w-4 mr-2 inline" />
            Browse
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'create'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/30'
                : 'bg-gray-600/20 text-gray-300 hover:bg-gray-600/30'
            }`}
          >
            <Plus className="h-4 w-4 mr-2 inline" />
            Create
          </button>
        </div>
      </div>

      {/* Browse Tab */}
      {activeTab === 'browse' && (
        <div className="space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search golf courses by name or location..."
              className="w-full bg-gray-700/50 text-white placeholder-gray-400 border border-gray-600/50 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Courses List */}
          {loading ? (
            <div className="text-center text-gray-400 py-8">Loading courses...</div>
          ) : courses.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              {searchQuery ? 'No courses found matching your search' : 'No courses available'}
            </div>
          ) : (
            <div className="space-y-4">
              {courses.map((course) => (
                <div key={course.id} className="bg-gray-700/30 rounded-lg p-6 border border-gray-600/30">
                  {/* Course Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">{course.name}</h3>
                      <div className="flex items-center text-gray-300 mb-2">
                        <MapPin className="h-4 w-4 mr-2" />
                        {course.location}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <div className="flex items-center">
                          <Flag className="h-4 w-4 mr-1" />
                          {course.holes} holes
                        </div>
                        {course.par && (
                          <div className="flex items-center">
                            <Award className="h-4 w-4 mr-1" />
                            Par {course.par}
                          </div>
                        )}
                        <div className="flex items-center">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          {course.review_count} reviews
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center mb-2">
                        {renderStars(Math.round(course.average_rating))}
                        <span className="ml-2 text-white font-semibold">
                          {course.average_rating.toFixed(1)}
                        </span>
                      </div>
                      <button
                        onClick={() => setShowReviewForm(showReviewForm === course.id ? null : course.id)}
                        className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-400/30 px-3 py-1 rounded-lg text-sm transition-colors"
                      >
                        Write Review
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  {course.description && (
                    <p className="text-gray-300 mb-4">{course.description}</p>
                  )}

                  {/* Review Form */}
                  {showReviewForm === course.id && (
                    <div className="mb-4 p-4 bg-gray-800/50 rounded-lg border border-gray-600/50">
                      <h4 className="text-white font-semibold mb-3">Write a Review</h4>
                      
                      <div className="mb-3">
                        <label className="block text-sm text-gray-300 mb-2">Rating:</label>
                        {renderStars(reviewForm.rating, true, (rating) => 
                          setReviewForm({ ...reviewForm, rating })
                        )}
                      </div>

                      <div className="mb-3">
                        <label className="block text-sm text-gray-300 mb-2">Comment:</label>
                        <textarea
                          value={reviewForm.comment}
                          onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                          placeholder="Share your experience playing this course..."
                          className="w-full bg-gray-700/50 text-white placeholder-gray-400 border border-gray-600/50 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                          rows={3}
                        />
                      </div>

                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => setShowReviewForm(null)}
                          className="bg-gray-600/20 text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-600/30 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => submitReview(course.id)}
                          disabled={!reviewForm.comment.trim()}
                          className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Submit Review
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Recent Reviews */}
                  {course.recent_reviews && course.recent_reviews.length > 0 && (
                    <div className="border-t border-gray-600/30 pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-white font-semibold">Recent Reviews</h4>
                        {course.review_count > 3 && (
                          <button
                            onClick={() => setExpandedCourse(expandedCourse === course.id ? null : course.id)}
                            className="text-emerald-400 hover:text-emerald-300 flex items-center text-sm"
                          >
                            {expandedCourse === course.id ? (
                              <>Show Less <ChevronUp className="h-4 w-4 ml-1" /></>
                            ) : (
                              <>Show All ({course.review_count}) <ChevronDown className="h-4 w-4 ml-1" /></>
                            )}
                          </button>
                        )}
                      </div>

                      <div className="space-y-3">
                        {(expandedCourse === course.id ? course.course_reviews : course.recent_reviews).map((review: Review) => (
                          <div key={review.id} className="bg-gray-800/30 rounded-lg p-3">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center">
                                  <Users className="h-4 w-4 text-black" />
                                </div>
                                <div>
                                  <div className="text-white font-medium text-sm">
                                    {review.user_profiles.first_name} {review.user_profiles.last_name}
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    {renderStars(review.rating)}
                                    <span className="text-xs text-gray-400">
                                      {formatTimeAgo(review.created_at)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <p className="text-gray-300 text-sm">{review.comment}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Tab */}
      {activeTab === 'create' && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-600/30">
            <h3 className="text-xl font-bold text-white mb-6">Create New Golf Course</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Course Name *
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="Enter course name"
                  className="w-full bg-gray-700/50 text-white placeholder-gray-400 border border-gray-600/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  value={createForm.location}
                  onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
                  placeholder="City, State or Address"
                  className="w-full bg-gray-700/50 text-white placeholder-gray-400 border border-gray-600/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Describe the course, amenities, difficulty, etc."
                  className="w-full bg-gray-700/50 text-white placeholder-gray-400 border border-gray-600/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Number of Holes
                  </label>
                  <input
                    type="number"
                    value={createForm.holes}
                    onChange={(e) => setCreateForm({ ...createForm, holes: e.target.value })}
                    placeholder="18"
                    min="1"
                    max="36"
                    className="w-full bg-gray-700/50 text-white placeholder-gray-400 border border-gray-600/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Par (optional)
                  </label>
                  <input
                    type="number"
                    value={createForm.par}
                    onChange={(e) => setCreateForm({ ...createForm, par: e.target.value })}
                    placeholder="72"
                    min="30"
                    max="90"
                    className="w-full bg-gray-700/50 text-white placeholder-gray-400 border border-gray-600/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  onClick={() => setCreateForm({
                    name: '', location: '', description: '', par: '', holes: '18'
                  })}
                  className="bg-gray-600/20 text-gray-300 px-6 py-2 rounded-lg hover:bg-gray-600/30 transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={createCourse}
                  disabled={!createForm.name.trim() || !createForm.location.trim() || loading}
                  className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Course
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
