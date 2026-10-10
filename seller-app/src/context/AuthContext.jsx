import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { authStorage } from '../api/authStorage'
import * as authApi from '../api/auth'

const AuthContext = createContext(null)

export function homeRouteFor(role) {
  if (role === 'manufacturer') return '/seller/dashboard'
  return '/seller/login'
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    const stored = authStorage.get()
    if (stored.token && stored.user) {
      setToken(stored.token)
      setUser(stored.user)
    }
    setInitializing(false)
  }, [])

  const handleAuth = useCallback(({ user: u, token: t, refreshToken: rt }, persist) => {
    authStorage.set({ token: t, refreshToken: rt, user: u, persist })
    setToken(t)
    setUser(u)
  }, [])

  const login = useCallback(
  async ({ email, password, persist }) => {
    const response = await authApi.login({ email, password })

    // response = { success, message, data }

    handleAuth(response.data, persist)

    return response.data.user
  },
  [handleAuth]
)

  const register = useCallback(
  async (payload) => {
    const response = await authApi.register(payload)

    if (response.data.token) {
      handleAuth(response.data, true)
    }

    return response.data.user
  },
  [handleAuth]
)
  // Clears local state first so the UI reacts immediately, then tells the
  // server to revoke this session. A network failure during that call must
  // never leave the browser signed in.
  const logout = useCallback(async () => {
    const { refreshToken } = authStorage.get()
    authStorage.clear()
    setToken(null)
    setUser(null)
    try {
      await authApi.logout({ refreshToken })
    } catch {
      // Session is already unusable locally; nothing else to do.
    }
  }, [])

  const logoutAll = useCallback(async () => {
    authStorage.clear()
    setToken(null)
    setUser(null)
    try {
      await authApi.logoutAll()
    } catch {
      // Same as above: local sign-out always wins.
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, initializing, login, register, logout, logoutAll }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
