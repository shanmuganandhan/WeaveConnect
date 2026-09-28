import { Navigate, useLocation } from 'react-router-dom'
import { useAuth, homeRouteFor } from '../context/AuthContext'

export function RouteLoading() {
  return (
    <div className="route-loading" role="status">
      <span className="route-loading-spinner" aria-hidden="true"></span>
      Loading…
    </div>
  )
}

/**
 * Base role-protected route.
 * - No user            -> redirect to /login?returnTo=<current path>
 * - Wrong role         -> redirect to /login (role mismatch must never leak a page)
 * - Correct role       -> render children
 */
export function RoleProtectedRoute({ role, allowedRoles, children }) {
  const { user, initializing } = useAuth()
  const location = useLocation()
  const effectiveRoles = allowedRoles || (role ? [role] : null)

  if (initializing) return <RouteLoading />
  if (!user) {
    const returnTo = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?returnTo=${returnTo}`} replace />
  }
  if (effectiveRoles && !effectiveRoles.includes(user.role)) return <Navigate to={homeRouteFor(user.role)} replace />
  return children
}

export function AdminRoute({ children }) {
  return <RoleProtectedRoute role="admin">{children}</RoleProtectedRoute>
}

export function ManufacturerRoute({ children }) {
  return <RoleProtectedRoute role="manufacturer">{children}</RoleProtectedRoute>
}

export function BuyerRoute({ children }) {
  return <RoleProtectedRoute role="buyer">{children}</RoleProtectedRoute>
}

/** Backwards-compatible alias used by callers that pass a `role` prop. */
export function RequireAuth({ role, children }) {
  return <RoleProtectedRoute role={role}>{children}</RoleProtectedRoute>
}

export function GuestOnly({ children }) {
  const { user, initializing } = useAuth()

  if (initializing) return <RouteLoading />
  if (user) return <Navigate to={homeRouteFor(user.role)} replace />
  return children
}
