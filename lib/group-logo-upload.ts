// Utility function for uploading group logos

export interface GroupLogoUploadResult {
  success: boolean
  logoUrl?: string
  error?: string
}

export async function uploadGroupLogo(
  file: File,
  groupId: string
): Promise<GroupLogoUploadResult> {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('groupId', groupId)

    const response = await fetch('/api/groups/upload-logo', {
      method: 'POST',
      body: formData,
    })

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to upload group logo'
      }
    }

    return {
      success: true,
      logoUrl: result.logoUrl
    }
  } catch (error) {
    console.error('Error uploading group logo:', error)
    return {
      success: false,
      error: 'Network error while uploading group logo'
    }
  }
}
