import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'
import * as buyerApi from '../api/buyerApi'

/**
 * The cart lives here instead of inside BuyerProvider because the header
 * (Navbar on the public pages and BuyerTopbar inside /buyer) has to show the
 * cart badge on every screen, including screens where no BuyerProvider is
 * mounted. One provider -> one source of truth -> the badge can never drift
 * from the cart page.
 *
 * Everything still goes through the existing buyerApi cart endpoints. No new
 * backend is involved.
 */

const CartContext = createContext(null)

const EMPTY_CART = { items: [] }

/**
 * The axios interceptor already unwraps `response.data`, so what arrives here
 * is the raw body: `{ success, message, data: { cart } }`.
 * Reading it defensively means a missing/partial payload renders an empty cart
 * instead of throwing "cannot read properties of undefined".
 */
function readCart(response) {
  const cart = response?.data?.cart
  if (!cart || typeof cart !== 'object') return { ...EMPTY_CART }
  return Array.isArray(cart.items) ? cart : { ...cart, items: [] }
}

export function CartProvider({ children }) {
  const { user, initializing } = useAuth()
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const isBuyer = user?.role === 'buyer'

  const refreshCart = useCallback(async () => {
    // Guests (and sellers/admins) never touch the cart endpoints - the server
    // would answer 401 and the interceptor would bounce them to /login.
    if (!isBuyer) {
      setCart(null)
      setError('')
      setLoading(false)
      return null
    }
    setLoading(true)
    setError('')
    try {
      const response = await buyerApi.getMyCart()
      const next = readCart(response)
      setCart(next)
      return next
    } catch (err) {
      setError(err?.message || 'We could not load your cart. Please try again.')
      return null
    } finally {
      setLoading(false)
    }
  }, [isBuyer])

  useEffect(() => {
    if (initializing) return
    refreshCart()
  }, [initializing, refreshCart])

  // Every cart endpoint answers with the updated cart, so the UI can be
  // updated straight from the response instead of firing a second request.
  const addItem = useCallback(async (productId, quantity = 1) => {
    const response = await buyerApi.addToMyCart(productId, quantity)
    const next = readCart(response)
    setCart(next)
    return next
  }, [])

  const updateItem = useCallback(async (productId, quantity) => {
    const response = await buyerApi.updateMyCartItem(productId, quantity)
    const next = readCart(response)
    setCart(next)
    return next
  }, [])

  const removeItem = useCallback(async (productId) => {
    const response = await buyerApi.removeFromMyCart(productId)
    const next = readCart(response)
    setCart(next)
    return next
  }, [])

  /**
   * The server already deletes the cart when the order is created, so after a
   * successful checkout we only need to reset what is on screen. No API call.
   */
  const clearCart = useCallback(() => {
    setCart({ ...EMPTY_CART })
  }, [])

  const items = useMemo(() => (Array.isArray(cart?.items) ? cart.items : []), [cart])

  const itemCount = items.length
  const totalQuantity = items.reduce((sum, item) => sum + (Number(item?.quantity) || 0), 0)
  const subtotal = items.reduce(
    (sum, item) => sum + (Number(item?.product?.price) || 0) * (Number(item?.quantity) || 0),
    0
  )

  const value = useMemo(
    () => ({
      cart,
      items,
      itemCount,
      totalQuantity,
      subtotal,
      loading,
      error,
      refreshCart,
      addItem,
      updateItem,
      removeItem,
      clearCart,
    }),
    [cart, items, itemCount, totalQuantity, subtotal, loading, error,
      refreshCart, addItem, updateItem, removeItem, clearCart]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
