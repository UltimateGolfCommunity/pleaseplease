// Utility functions for handling logo uploads

export interface LogoUploadResult {
  success: boolean
  logoUrl?: string
  error?: string
}

export async function uploadLogo(file: File): Promise<LogoUploadResult> {
  try {
    // Validate file
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'File must be an image' }
    }

    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: 'File size must be less than 5MB' }
    }

    // Create FormData
    const formData = new FormData()
    formData.append('logo', file)

    // Upload to API endpoint
    const response = await fetch('/api/upload-logo', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      return { success: false, error: errorData.error || 'Upload failed' }
    }

    const data = await response.json()
    return { success: true, logoUrl: data.logoUrl }

  } catch (error) {
    console.error('Logo upload error:', error)
    return { success: false, error: 'Upload failed. Please try again.' }
  }
}

export function generateLogoFileName(courseName: string, fileExtension: string): string {
  // Convert course name to lowercase, replace spaces with hyphens, remove special chars
  const cleanName = courseName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim()
  
  return `${cleanName}-logo.${fileExtension}`
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || 'png'
}
