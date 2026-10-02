import { Routes, Route, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth, homeRouteFor } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { WishlistProvider } from './context/WishlistContext'
import { BuyerProvider } from './context/BuyerContext'

import BuyerLayout from './layouts/BuyerLayout'
import PublicLayout from './layouts/PublicLayout'
import HomePage from './components/HomePage'
import Login from './components/Login'
import Register from './components/Register'
import Products from './components/Products'
import ProductDetails from './components/ProductDetails'
import ManufacturerStore from './components/ManufacturerStore'
import ErrorPage from './components/ErrorPage'


import BuyerDashboard from './pages/buyer/BuyerDashboard'
import BuyerHome from './pages/buyer/BuyerHome'
import BuyerCollection from './pages/buyer/BuyerCollection'
import BuyerOrders from './pages/buyer/BuyerOrders'
import BuyerCart from './pages/buyer/BuyerCart'
import BuyerCheckout from './pages/buyer/BuyerCheckout'
import BuyerWishlist from './pages/buyer/BuyerWishlist'
import BuyerProfile from './pages/buyer/BuyerProfile'

import { RoleProtectedRoute } from './routes/ProtectedRoutes'
const SELLER_APP = import.meta.env.VITE_SELLER_APP_URL || 'http://localhost:3001'

function SellerRedirect() {

  const { '*': subpath } = useParams()


  window.location.href = `${SELLER_APP}/${subpath ? 'seller/' + subpath : 'seller/login'}`


  return <div className="app-page-loader">Redirecting to Seller Hub…</div>
}


export default function App() {

  const { user, initializing } = useAuth()
  const [searchParams] = useSearchParams()

  // Only internal paths are accepted, so a crafted ?returnTo= can never send
  // a signed-in shopper to another site.
  const rawReturnTo = searchParams.get('returnTo')
  const returnTo =
    typeof rawReturnTo === 'string' && rawReturnTo.startsWith('/') && !rawReturnTo.startsWith('//')
      ? rawReturnTo
      : ''

  if (initializing) {
    return <div className="app-page-loader">Loading…</div>
  }


  return (
    // CartProvider sits above every route (public pages included) so the header
    // cart badge is driven by the same state the cart page renders.
    // WishlistProvider is mounted at the same level because the "save" button
    // lives on the public product pages, which render outside /buyer.
    <CartProvider>
      <WishlistProvider>
      <Routes>

        {/* Public storefront: shared header, footer and scroll reset. */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />

          <Route path="/products" element={<Products />} />

          <Route path="/product/:id" element={<ProductDetails />} />

          {/* Public storefront of a single seller, linked from each product page */}
          <Route path="/store/:id" element={<ManufacturerStore />} />

          <Route path="*" element={<ErrorPage />} />
        </Route>

        {/* Signing in (or being already signed in) always lands on the home page for the role. */}
        <Route path="/login" element={user ? <Navigate to={returnTo || homeRouteFor(user.role)} replace /> : <Login />} />

        <Route path="/register" element={user ? <Navigate to={homeRouteFor(user.role)} replace /> : <Register />} />


      <Route path="/buyer" element={
        <RoleProtectedRoute allowedRoles={['buyer']}>
          <BuyerProvider>
            <BuyerLayout />
          </BuyerProvider>
        </RoleProtectedRoute>
      }>
        {/* "/buyer" alone (no subpath) -> redirect to the buyer dashboard */}
        <Route index element={<Navigate to="dashboard" replace />} />

        {/* "/buyer/dashboard" -> Buyer's main dashboard with order summary */}
        <Route path="dashboard" element={<BuyerDashboard />} />

        {/* "/buyer/home" -> Buyer's landing page inside the account area */}
        <Route path="home" element={<BuyerHome />} />

        {/* "/buyer/collection" -> Product catalog for buyers */}
        <Route path="collection" element={<BuyerCollection />} />

        {/* "/buyer/cart" -> Shopping cart page */}
        <Route path="cart" element={<BuyerCart />} />


        <Route path="checkout" element={<BuyerCheckout />} />


        <Route path="orders" element={<BuyerOrders />} />



        <Route path="wishlist" element={<BuyerWishlist />} />



        <Route path="profile" element={<BuyerProfile />} />
      </Route>


      <Route path="/seller/*" element={<SellerRedirect />} />

    </Routes>
      </WishlistProvider>
    </CartProvider>
  )
}
