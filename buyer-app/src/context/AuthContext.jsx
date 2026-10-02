import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { authStorage } from '../api/authStorage'
import * as authApi from '../api/auth'

const AuthContext = createContext(null)

export function homeRouteFor(role) {
  if (role === 'admin') return '/admin/dashboard'
  if (role === 'manufacturer') return '/manufacturer/dashboard'
  return '/buyer/dashboard'
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

  const handleAuth = useCallback(({ user: u, token: t }, persist) => {
    authStorage.set({ token: t, user: u, persist })
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
  const logout = useCallback(() => {
    authStorage.clear()
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, initializing, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
