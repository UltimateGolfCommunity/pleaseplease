const siteUrl = (process.env.EXPO_PUBLIC_SITE_URL || 'https://www.ultimategolfcommunity.com').replace(/\/$/, '')

// Navigation in the app revisits the same feed, group, and profile endpoints
// frequently. Keeping a very short in-memory cache makes those revisits feel
// immediate while still allowing the server to remain the source of truth.
const GET_CACHE_TTL_MS = 15_000
const getCache = new Map<string, { expiresAt: number; payload: unknown }>()
const pendingGets = new Map<string, Promise<unknown>>()

function clearGetCache() {
  getCache.clear()
  pendingGets.clear()
}

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
  const url = getApiUrl(path)
  const cached = getCache.get(url)
  if (cached && cached.expiresAt > Date.now()) return cached.payload as T

  const pending = pendingGets.get(url)
  if (pending) return pending as Promise<T>

  const request = (async () => {
    const response = await fetch(url)
    const payload = await parseJson(response)

    if (!response.ok) {
      throw new Error(payload?.error || payload?.message || 'Request failed.')
    }

    getCache.set(url, { expiresAt: Date.now() + GET_CACHE_TTL_MS, payload })
    // Keep the cache bounded during a long session without retaining stale
    // search results indefinitely.
    if (getCache.size > 80) {
      for (const [key, value] of getCache) {
        if (value.expiresAt <= Date.now() || getCache.size > 60) getCache.delete(key)
      }
    }
    return payload as T
  })()

  pendingGets.set(url, request)
  try {
    return await request
  } finally {
    pendingGets.delete(url)
  }
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

  clearGetCache()
  return payload as T
}

export async function apiDelete<T>(path: string, body?: Record<string, unknown>) {
  const response = await fetch(getApiUrl(path), {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  })

  const payload = await parseJson(response)

  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || 'Delete request failed.')
  }

  clearGetCache()
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

  clearGetCache()
  return payload as T
}
