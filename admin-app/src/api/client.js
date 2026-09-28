import axios from 'axios'
import { authStorage } from './authStorage'

const AUTH_PATHS = ['/auth/login', '/auth/register']

export function normalizeError(err) {
  const status = err?.response?.status
  const data = err?.response?.data
  const message =
    data?.message ||
    (err?.code === 'ERR_NETWORK'
      ? 'Cannot reach the server. Is the backend running?'
      : err?.message || 'Something went wrong')

  const fieldErrors = {}
  if (Array.isArray(data?.errors)) {
    for (const e of data.errors) {
      const field = e.field || e.path || e.param
      if (field) fieldErrors[field] = e.message || message
    }
  }

  const normalized = new Error(message)
  normalized.status = status
  normalized.fieldErrors = fieldErrors
  return normalized
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { Accept: 'application/json' },
  timeout: 60000,
})

api.interceptors.request.use((config) => {
  const token = authStorage.getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const normalized = normalizeError(error)
    const config = error?.config
    const isAuthRequest = config?.url && AUTH_PATHS.some((p) => config.url.includes(p))
    if (normalized.status === 401 && !isAuthRequest) {
      authStorage.clear()
      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }
    return Promise.reject(normalized)
  }
)

export default api
