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


export function RoleProtectedRoute({ allowedRoles, children }) {
  const { user, initializing } = useAuth()
  const location = useLocation()

  if (initializing) return <RouteLoading />
  if (!user) {
    const returnTo = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?returnTo=${returnTo}`} replace />
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={homeRouteFor(user.role)} replace />
  }
  return children
}

export function AdminRoute({ children }) {
  return <RoleProtectedRoute allowedRoles={['admin']}>{children}</RoleProtectedRoute>
}

export function ManufacturerRoute({ children }) {
  return <RoleProtectedRoute allowedRoles={['manufacturer']}>{children}</RoleProtectedRoute>
}

export function BuyerRoute({ children }) {
  return <RoleProtectedRoute allowedRoles={['buyer']}>{children}</RoleProtectedRoute>
}

/** Backwards-compatible alias used by callers that pass a `role` prop. */
export function RequireAuth({ role, children }) {
  return <RoleProtectedRoute allowedRoles={[role]}>{children}</RoleProtectedRoute>
}

export function GuestOnly({ children }) {
  const { user, initializing } = useAuth()

  if (initializing) return <RouteLoading />
  if (user) return <Navigate to={homeRouteFor(user.role)} replace />
  return children
}
