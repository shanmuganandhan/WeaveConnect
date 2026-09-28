import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { AdminProvider } from './context/AdminContext'
import AdminLayout from './layouts/AdminLayout'

import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminManufacturers from './pages/admin/AdminManufacturers'
import AdminSellerRequests from './pages/admin/AdminSellerRequests'
import AdminProducts from './pages/admin/AdminProducts'
import AdminOrders from './pages/admin/AdminOrders'
import AdminAnalytics from './pages/admin/AdminAnalytics'
import AdminSettings from './pages/admin/AdminSettings'

import { RoleProtectedRoute } from './routes/ProtectedRoutes'

import ErrorPage from './components/ErrorPage'

export default function App() {
  const { user, initializing } = useAuth()

  if (initializing) {
    return <div className="app-page-loader">Loading…</div>
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to={user?.role === 'admin' ? '/admin/dashboard' : '/login'} replace />} />

      <Route path="/login" element={user?.role === 'admin' ? <Navigate to="/admin/dashboard" replace /> : <AdminLogin />} />

      <Route path="/admin" element={
        <RoleProtectedRoute allowedRoles={['admin']}>
          <AdminProvider>
            <AdminLayout />
          </AdminProvider>
        </RoleProtectedRoute>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="manufacturers" element={<AdminManufacturers />} />
        <Route path="seller-requests" element={<AdminSellerRequests />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      <Route path="*" element={<ErrorPage />} />
    </Routes>
  )
}
