export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'
export function getToken() {
  return sessionStorage.getItem('token')
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken()
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    credentials: 'include',
  })

  if (res.status === 401) {
    // Try refresh
    const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
    if (refreshRes.ok) {
      const data = await refreshRes.json()
      sessionStorage.setItem('token', data.accessToken)
      // Retry original request
      const retry = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${data.accessToken}`,
          ...options.headers,
        },
        credentials: 'include',
      })
      if (!retry.ok) throw new ApiError(await retry.json(), retry.status)
      return retry.json()
    }
    sessionStorage.removeItem('token')
    globalThis.location.href = '/login'
    throw new ApiError({ message: 'Session expired' }, 401)
  }

  if (!res.ok) throw new ApiError(await res.json(), res.status)
  return res.json()
}

export class ApiError extends Error {
  status: number
  errors?: any
  constructor(body: any, status: number) {
    super(body.message || 'Request failed')
    this.status = status
    this.errors = body.errors
  }
}
