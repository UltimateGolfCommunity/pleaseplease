'use client'

import { useState, useEffect } from 'react'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  MapPin, 
  Phone, 
  Globe, 
  Star,
  Camera,
  Settings,
  Eye,
  Save,
  X,
  Check
} from 'lucide-react'

interface Course {
  id: string
  name: string
  location: string
  description: string
  par: number
  holes: number
  course_image_url?: string
  logo_url?: string
  website_url?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  country?: string
  latitude?: number
  longitude?: number
  course_type?: string
  green_fees_min?: number
  green_fees_max?: number
  cart_fees?: number
  caddie_available?: boolean
  pro_shop?: boolean
  restaurant?: boolean
  driving_range?: boolean
  putting_green?: boolean
  practice_facilities?: boolean
  lessons_available?: boolean
  dress_code?: string
  booking_policy?: string
  cancellation_policy?: string
  is_featured?: boolean
  is_active?: boolean
  average_rating?: number
  review_count?: number
  course_photos?: any[]
  course_amenities?: any[]
  course_holes?: any[]
}

interface CourseForm {
  name: string
  location: string
  description: string
  par: number
  holes: number
  course_image_url: string
  logo_url: string
  website_url: string
  phone: string
  email: string
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
  booking_policy: string
  cancellation_policy: string
  is_featured: boolean
}

export default function GolfCourseManagement() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  
  const [formData, setFormData] = useState<CourseForm>({
    name: '',
    location: '',
    description: '',
    par: 72,
    holes: 18,
    course_image_url: '',
    logo_url: '',
    website_url: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'USA',
    latitude: 0,
    longitude: 0,
    course_type: 'public',
    green_fees_min: 0,
    green_fees_max: 0,
    cart_fees: 0,
    caddie_available: false,
    pro_shop: true,
    restaurant: true,
    driving_range: true,
    putting_green: true,
    practice_facilities: true,
    lessons_available: false,
    dress_code: '',
    booking_policy: '',
    cancellation_policy: '',
    is_featured: false
  })

  const [submitting, setSubmitting] = useState(false)

  // Load courses on component mount
  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/golf-courses/manage?action=list')
      
      if (response.ok) {
        const data = await response.json()
        setCourses(data.courses || [])
      } else {
        console.error('Failed to fetch courses')
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCourse = async () => {
    if (!formData.name || !formData.location) {
      alert('Course name and location are required')
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch('/api/golf-courses/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          ...formData
        })
      })

      if (response.ok) {
        const data = await response.json()
        alert('Course created successfully!')
        setShowCreateModal(false)
        resetForm()
        fetchCourses()
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to create course')
      }
    } catch (error) {
      console.error('Error creating course:', error)
      alert('Failed to create course. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateCourse = async () => {
    if (!editingCourse?.id) return

    try {
      setSubmitting(true)
      const response = await fetch('/api/golf-courses/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update',
          course_id: editingCourse.id,
          ...formData
        })
      })

      if (response.ok) {
        const data = await response.json()
        alert('Course updated successfully!')
        setShowEditModal(false)
        setEditingCourse(null)
        resetForm()
        fetchCourses()
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to update course')
      }
    } catch (error) {
      console.error('Error updating course:', error)
      alert('Failed to update course. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course)
    setFormData({
      name: course.name,
      location: course.location,
      description: course.description || '',
      par: course.par || 72,
      holes: course.holes || 18,
      course_image_url: course.course_image_url || '',
      logo_url: course.logo_url || '',
      website_url: course.website_url || '',
      phone: course.phone || '',
      email: course.email || '',
      address: course.address || '',
      city: course.city || '',
      state: course.state || '',
      zip_code: course.zip_code || '',
      country: course.country || 'USA',
      latitude: course.latitude || 0,
      longitude: course.longitude || 0,
      course_type: course.course_type || 'public',
      green_fees_min: course.green_fees_min || 0,
      green_fees_max: course.green_fees_max || 0,
      cart_fees: course.cart_fees || 0,
      caddie_available: course.caddie_available || false,
      pro_shop: course.pro_shop !== false,
      restaurant: course.restaurant !== false,
      driving_range: course.driving_range !== false,
      putting_green: course.putting_green !== false,
      practice_facilities: course.practice_facilities !== false,
      lessons_available: course.lessons_available || false,
      dress_code: course.dress_code || '',
      booking_policy: course.booking_policy || '',
      cancellation_policy: course.cancellation_policy || '',
      is_featured: course.is_featured || false
    })
    setShowEditModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      description: '',
      par: 72,
      holes: 18,
      course_image_url: '',
      logo_url: '',
      website_url: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'USA',
      latitude: 0,
      longitude: 0,
      course_type: 'public',
      green_fees_min: 0,
      green_fees_max: 0,
      cart_fees: 0,
      caddie_available: false,
      pro_shop: true,
      restaurant: true,
      driving_range: true,
      putting_green: true,
      practice_facilities: true,
      lessons_available: false,
      dress_code: '',
      booking_policy: '',
      cancellation_policy: '',
      is_featured: false
    })
  }

  const CourseModal = ({ isEdit = false }) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Golf Course' : 'Add New Golf Course'}
          </h3>
          <button
            onClick={() => {
              if (isEdit) {
                setShowEditModal(false)
                setEditingCourse(null)
              } else {
                setShowCreateModal(false)
              }
              resetForm()
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Basic Information</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Course Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                placeholder="Enter course name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Location *
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                placeholder="City, State"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 bg-white dark:bg-slate-700 text-gray-900 dark:text-white resize-none"
                rows={3}
                placeholder="Describe the course..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Par
                </label>
                <input
                  type="number"
                  value={formData.par}
                  onChange={(e) => setFormData(prev => ({ ...prev, par: parseInt(e.target.value) || 72 }))}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  min="54"
                  max="80"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Holes
                </label>
                <select
                  value={formData.holes}
                  onChange={(e) => setFormData(prev => ({ ...prev, holes: parseInt(e.target.value) }))}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                >
                  <option value={9}>9 Holes</option>
                  <option value={18}>18 Holes</option>
                  <option value={27}>27 Holes</option>
                  <option value={36}>36 Holes</option>
                </select>
              </div>
            </div>
          </div>

          {/* Images and Contact */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Images & Contact</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Course Image URL
              </label>
              <input
                type="url"
                value={formData.course_image_url}
                onChange={(e) => setFormData(prev => ({ ...prev, course_image_url: e.target.value }))}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                placeholder="https://example.com/course-image.jpg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Logo URL
              </label>
              <input
                type="url"
                value={formData.logo_url}
                onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Website URL
              </label>
              <input
                type="url"
                value={formData.website_url}
                onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                placeholder="https://example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                placeholder="(555) 123-4567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                placeholder="info@example.com"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {
              if (isEdit) {
                setShowEditModal(false)
                setEditingCourse(null)
              } else {
                setShowCreateModal(false)
              }
              resetForm()
            }}
            className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={isEdit ? handleUpdateCourse : handleCreateCourse}
            disabled={submitting}
            className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-400 text-white rounded-lg transition-colors font-semibold disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {isEdit ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isEdit ? 'Update Course' : 'Create Course'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading courses...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Golf Course Management</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage golf courses, upload images, and configure amenities
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg transition-colors font-medium flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Course
        </button>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div key={course.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Course Image */}
            <div className="h-48 bg-gray-200 dark:bg-gray-700 relative">
              {course.course_image_url ? (
                <img
                  src={course.course_image_url}
                  alt={course.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Camera className="w-12 h-12 text-gray-400" />
                </div>
              )}
              {course.is_featured && (
                <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                  Featured
                </div>
              )}
            </div>

            {/* Course Info */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {course.name}
                </h3>
                {course.logo_url && (
                  <img
                    src={course.logo_url}
                    alt={`${course.name} logo`}
                    className="w-8 h-8 object-contain"
                  />
                )}
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                {course.location}
              </p>
              
              <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                {course.description}
              </p>

              {/* Course Stats */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span>Par {course.par}</span>
                  <span>{course.holes} Holes</span>
                </div>
                {course.average_rating && course.average_rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {course.average_rating}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({course.review_count})
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedCourse(course)}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  View
                </button>
                <button
                  onClick={() => handleEditCourse(course)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-3 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-1"
                >
                  <Edit className="w-3 h-3" />
                  Edit
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {courses.length === 0 && (
        <div className="text-center py-12">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <Settings className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            No Courses Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Get started by adding your first golf course
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg transition-colors font-medium flex items-center gap-2 mx-auto"
          >
            <Plus className="w-4 h-4" />
            Add Your First Course
          </button>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && <CourseModal />}
      {showEditModal && <CourseModal isEdit={true} />}
    </div>
  )
}
