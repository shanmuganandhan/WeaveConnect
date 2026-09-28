import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAdmin } from '../context/AdminContext'
import AdminSidebar from '../components/admin/AdminSidebar'
import AdminTopbar from '../components/admin/AdminTopbar'
import useSimulatedLoading from '../hooks/useSimulatedLoading'
import { SkeletonGrid } from '../components/ui/Skeleton'
import { ErrorState } from '../components/ui/States'
import Toast from '../components/ui/Toast'
import '../components/admin/AdminDashboard.css'

const SIDEBAR_LABELS = {
  '/admin/dashboard': 'Dashboard',
  '/admin/users': 'Users',
  '/admin/manufacturers': 'Manufacturers',
  '/admin/products': 'Products',
  '/admin/orders': 'Orders',
  '/admin/analytics': 'Analytics',
  '/admin/settings': 'Settings',
}

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const { loading, error, toast, refresh } = useAdmin()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const simulated = useSimulatedLoading(600)

  const activeLabel = SIDEBAR_LABELS[location.pathname] || 'Dashboard'

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="admin-layout">
      <button
        className={`admin-hamburger ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle sidebar"
        aria-expanded={sidebarOpen}
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>

      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        onLogout={handleLogout}
      />

      <main className="admin-main">
        <AdminTopbar title={activeLabel} />
        <div className="admin-content">
          {simulated || loading ? (
            <SkeletonGrid count={3} />
          ) : error ? (
            <ErrorState title="Could not load admin data" message={error} onRetry={refresh} />
          ) : (
            <Outlet />
          )}
        </div>
      </main>
      <Toast toast={toast} />
    </div>
  )
}
