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
  if (options.authToken) {
    headers.set('Authorization', `Bearer ${options.authToken}`)
  }

  if (options.body && !headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers,
  })

  return parseResponse<T>(response)
}
