// Utility function for uploading group images (profile and header)

export interface GroupImageUploadResult {
  success: boolean
  imageUrl?: string
  error?: string
}

export async function uploadGroupImage(
  file: File,
  groupId: string,
  imageType: 'profile' | 'header'
): Promise<GroupImageUploadResult> {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('groupId', groupId)
    formData.append('imageType', imageType)

    const response = await fetch('/api/groups/upload-image', {
      method: 'POST',
      body: formData,
    })

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to upload group image'
      }
    }

    return {
      success: true,
      imageUrl: result.imageUrl
    }
  } catch (error) {
    console.error('Error uploading group image:', error)
    return {
      success: false,
      error: 'Network error while uploading group image'
    }
  }
}
