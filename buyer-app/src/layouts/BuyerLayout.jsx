import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useBuyer } from '../context/BuyerContext'
import BuyerTopbar from '../components/buyer/BuyerTopbar'
import BuyerFooter from '../components/buyer/BuyerFooter'
import { SkeletonCard } from '../components/ui/Skeleton'
import { ErrorState } from '../components/ui/States'
import Toast from '../components/ui/Toast'
import '../components/buyer/BuyerDashboard.css'

export default function BuyerLayout() {
  const { user, logout } = useAuth()
  const { loading, error, toast, refresh } = useBuyer()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="bd-page">
      <BuyerTopbar userName={user?.name} onLogout={handleLogout} />

      <main className="bd-content">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : error ? (
          <ErrorState title="Could not load your account data" message={error} onRetry={refresh} />
        ) : (
          <Outlet />
        )}
      </main>

      <BuyerFooter />
      <Toast toast={toast} />
    </div>
  )
}
