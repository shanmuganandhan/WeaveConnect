import axios from 'axios'
import { authStorage } from './authStorage'

// These are the public auth endpoints. A 401 from any of them is a normal
// "wrong details" answer, so we must not clear the session or redirect.
const AUTH_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/logout',
  '/auth/logout-all',
  '/auth/forgot-password',
  '/auth/verify-otp',
  '/auth/reset-password',
]

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

// Only internal paths are accepted, so a crafted ?returnTo= can never push a
// signed-in admin to another site.
function loginUrlWithReturn() {
  const current = window.location.pathname + window.location.search + window.location.hash
  const safe = current.startsWith('/') && !current.startsWith('//') ? current : '/'
  return `/login?returnTo=${encodeURIComponent(safe)}`
}

function endSession() {
  authStorage.clear()
  if (window.location.pathname !== '/login') {
    window.location.assign(loginUrlWithReturn())
  }
}

// ---------------------------------------------------------------------------
// Silent refresh: when the short-lived access token expires we exchange the
// stored refresh token for a new one and replay the original request, so the
// admin is never thrown out mid-session. All callers share ONE in-flight
// refresh, otherwise a page that fires five parallel requests would fire five
// refreshes and rotate the refresh token out from under itself.
// ---------------------------------------------------------------------------
let refreshPromise = null

async function refreshSession() {
  const { refreshToken } = authStorage.get()
  if (!refreshToken) throw new Error('No refresh token')

  // Raw axios (not `api`) so the refresh call never re-enters these
  // interceptors and cannot recurse.
  const res = await axios.post(
    `${api.defaults.baseURL}/auth/refresh`,
    { refreshToken },
    { headers: { Accept: 'application/json' }, timeout: api.defaults.timeout }
  )

  const data = res.data?.data
  if (!data?.token) throw new Error('Refresh failed')

  const stored = authStorage.get()
  authStorage.set({
    token: data.token,
    refreshToken: data.refreshToken,
    user: data.user || stored.user,
    persist: stored.persist,
  })
  return data.token
}

function runRefresh() {
  if (!refreshPromise) {
    refreshPromise = refreshSession().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

api.interceptors.request.use((config) => {
  const token = authStorage.getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const normalized = normalizeError(error)
    const config = error?.config
    const url = config?.url || ''
    const isAuthRequest = AUTH_PATHS.some((p) => url.includes(p))

    // One retry only: if the replayed request also comes back 401 the
    // session is genuinely dead and we fall through to the cleanup below.
    if (normalized.status === 401 && !isAuthRequest && !config.__retried) {
      try {
        const freshToken = await runRefresh()
        config.__retried = true
        config.headers = { ...config.headers, Authorization: `Bearer ${freshToken}` }
        return api(config)
      } catch {
        endSession()
        return Promise.reject(normalized)
      }
    }

    if (normalized.status === 401 && !isAuthRequest) {
      endSession()
    }
    return Promise.reject(normalized)
  }
)

export default api
