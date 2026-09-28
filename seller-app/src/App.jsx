import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { ManufacturerProvider } from './context/ManufacturerContext'
import ManufacturerLayout from './layouts/ManufacturerLayout'

import SellerLogin from './pages/SellerLogin'
import SellerRegister from './pages/manufacturer/SellerRegister'
import ManufacturerDashboard from './pages/manufacturer/ManufacturerDashboard'
import ManufacturerProducts from './pages/manufacturer/ManufacturerProducts'
import ManufacturerAddProduct from './pages/manufacturer/ManufacturerAddProduct'
import ManufacturerOrders from './pages/manufacturer/ManufacturerOrders'
import ManufacturerAnalytics from './pages/manufacturer/ManufacturerAnalytics'
import ManufacturerProfile from './pages/manufacturer/ManufacturerProfile'

import { RoleProtectedRoute } from './routes/ProtectedRoutes'

import ErrorPage from './components/ErrorPage'

export default function App() {
  const { user, initializing } = useAuth()

  if (initializing) {
    return <div className="app-page-loader">Loading…</div>
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to={user?.role === 'manufacturer' ? '/seller/dashboard' : '/seller/login'} replace />} />

      <Route path="/login" element={<Navigate to="/seller/login" replace />} />
      <Route path="/register" element={<Navigate to="/seller/register" replace />} />

      <Route path="/seller/login" element={user?.role === 'manufacturer' ? <Navigate to="/seller/dashboard" replace /> : <SellerLogin />} />
      <Route path="/seller/register" element={user?.role === 'manufacturer' ? <Navigate to="/seller/dashboard" replace /> : <SellerRegister />} />

      <Route path="/seller" element={
        <RoleProtectedRoute allowedRoles={['manufacturer']}>
          <ManufacturerProvider>
            <ManufacturerLayout />
          </ManufacturerProvider>
        </RoleProtectedRoute>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<ManufacturerDashboard />} />
        <Route path="products" element={<ManufacturerProducts />} />
        <Route path="products/add" element={<ManufacturerAddProduct />} />
        <Route path="orders" element={<ManufacturerOrders />} />
        <Route path="analytics" element={<ManufacturerAnalytics />} />
        <Route path="profile" element={<ManufacturerProfile />} />
      </Route>

      <Route path="*" element={<ErrorPage />} />
    </Routes>
  )
}
