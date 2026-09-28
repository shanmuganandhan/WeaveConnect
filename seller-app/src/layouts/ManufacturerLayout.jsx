import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useManufacturer } from '../context/ManufacturerContext'
import ManufacturerSidebar from '../components/manufacturer/ManufacturerSidebar'
import ManufacturerTopbar from '../components/manufacturer/ManufacturerTopbar'
import useSimulatedLoading from '../hooks/useSimulatedLoading'
import { SkeletonGrid } from '../components/ui/Skeleton'
import { ErrorState } from '../components/ui/States'
import Toast from '../components/ui/Toast'
import '../components/manufacturer/ManufacturerDashboard.css'

export default function ManufacturerLayout() {
  const { user, logout } = useAuth()
  const { loading, error, toast, refresh } = useManufacturer()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const simulated = useSimulatedLoading(600)

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="md-shell">
      <ManufacturerSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />

      <main className="md-main">
        <ManufacturerTopbar
          pathname={location.pathname}
          userName={user?.name}
          onOpenMenu={() => setSidebarOpen(true)}
        />

        <div className="md-content">
          {simulated || loading ? (
            <SkeletonGrid count={3} />
          ) : error ? (
            <ErrorState title="Could not load dashboard" message={error} onRetry={refresh} />
          ) : (
            <Outlet />
          )}
          <Toast toast={toast} />
        </div>
      </main>
    </div>
  )
}
