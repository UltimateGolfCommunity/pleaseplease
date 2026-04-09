const siteUrl = (process.env.EXPO_PUBLIC_SITE_URL || 'https://www.ultimategolfcommunity.com').replace(/\/$/, '')

export function getApiUrl(path: string) {
  return `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`
}

async function parseJson(response: Response) {
  const text = await response.text()

  if (!text) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    throw new Error('The API returned an unreadable response.')
  }
}

export async function apiGet<T>(path: string) {
  const response = await fetch(getApiUrl(path))
  const payload = await parseJson(response)

  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || 'Request failed.')
  }

  return payload as T
}

export async function apiPost<T>(path: string, body: Record<string, unknown>) {
  const response = await fetch(getApiUrl(path), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })

  const payload = await parseJson(response)

  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || 'Request failed.')
  }

  return payload as T
}

export async function apiUploadImage<T>(path: string, formData: FormData) {
  const response = await fetch(getApiUrl(path), {
    method: 'POST',
    body: formData
  })

  const payload = await parseJson(response)

  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || 'Upload failed.')
  }

  return payload as T
}
