// Location utilities for distance calculations and zip code lookups

export interface Location {
  latitude: number
  longitude: number
  zipCode?: string
  city?: string
  state?: string
}

// Haversine formula to calculate distance between two points
export function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 3959 // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  
  return distance
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

// Get coordinates for a zip code using a geocoding service
export async function getZipCodeCoordinates(zipCode: string): Promise<Location | null> {
  try {
    // First try a free geocoding service
    const response = await fetch(
      `https://api.zippopotam.us/us/${zipCode}`
    )
    
    if (response.ok) {
      const data = await response.json()
      if (data.places && data.places.length > 0) {
        return {
          latitude: parseFloat(data.places[0].latitude),
          longitude: parseFloat(data.places[0].longitude),
          zipCode: data['post code'],
          city: data.places[0]['place name'],
          state: data.places[0]['state']
        }
      }
    }
    
    // Fallback to OpenCage Geocoding (requires API key)
    if (process.env.NEXT_PUBLIC_OPENCAGE_API_KEY) {
      const opencageResponse = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${zipCode}&key=${process.env.NEXT_PUBLIC_OPENCAGE_API_KEY}`
      )
      
      if (opencageResponse.ok) {
        const opencageData = await opencageResponse.json()
        if (opencageData.results && opencageData.results.length > 0) {
          const result = opencageData.results[0]
          return {
            latitude: result.geometry.lat,
            longitude: result.geometry.lng,
            zipCode: zipCode,
            city: result.components.city || result.components.town,
            state: result.components.state
          }
        }
      }
    }
    
    return null
  } catch (error) {
    console.error('Error getting zip code coordinates:', error)
    return null
  }
}

// Filter courses within a certain radius
export function filterCoursesByRadius(
  courses: any[],
  centerLat: number,
  centerLon: number,
  radiusMiles: number
): any[] {
  return courses.filter(course => {
    if (!course.latitude || !course.longitude) {
      return false
    }
    
    const distance = calculateDistance(
      centerLat,
      centerLon,
      course.latitude,
      course.longitude
    )
    
    return distance <= radiusMiles
  }).map(course => ({
    ...course,
    distance: calculateDistance(
      centerLat,
      centerLon,
      course.latitude,
      course.longitude
    )
  })).sort((a, b) => a.distance - b.distance) // Sort by distance
}

// Validate zip code format
export function isValidZipCode(zipCode: string): boolean {
  const usZipRegex = /^\d{5}(-\d{4})?$/
  return usZipRegex.test(zipCode)
}

// Format distance for display
export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 10) / 10} mi`
  } else if (distance < 10) {
    return `${Math.round(distance * 10) / 10} mi`
  } else {
    return `${Math.round(distance)} mi`
  }
}
