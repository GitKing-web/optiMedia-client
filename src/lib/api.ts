const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://optimedia-client.onrender.com'

export class ApiError extends Error {
  status: number
  details?: string[]

  constructor(message: string, status: number, details?: string[]) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

type RequestOptions = RequestInit & {
  authToken?: string | null
}

/**
 * The auth store registers a provider that returns the current JWT in memory.
 * Sending it explicitly in the Authorization header makes authenticated requests
 * independent of cross-site cookie behavior (SameSite=None can be dropped or
 * blocked by some browsers/devices), which is the main cause of intermittent
 * "Unauthorized" failures during checkout.
 */
let authTokenProvider: (() => string | null) | null = null

export function setAuthTokenProvider(fn: (() => string | null) | null) {
  authTokenProvider = fn
}

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await response.json() : await response.text()

  if (!response.ok) {
    const message = typeof data === 'object' && data && 'message' in data ? String(data.message) : 'Request failed'
    const details = typeof data === 'object' && data && 'details' in data && Array.isArray(data.details)
      ? data.details.map((detail: unknown) => String(detail))
      : undefined
    throw new ApiError(message, response.status, details)
  }

  return data as T
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}) {
  const headers = new Headers(options.headers)

  // Prefer an explicit token, then the in-memory provider, then fall back to
  // the HttpOnly cookie (credentials: 'include') for the reload case.
  const token = options.authToken ?? authTokenProvider?.() ?? null
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  if (options.body && !headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  })

  return parseResponse<T>(response)
}
