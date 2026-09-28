import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as buyerApi from '../api/buyerApi'
import { useToast } from '../hooks/useToast'

const BuyerContext = createContext(null)

export function BuyerProvider({ children }) {
  const [orders, setOrders] = useState([])
  const [wishlist, setWishlist] = useState([])
  const [profile, setProfile] = useState(null)
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { toast, showToast } = useToast()

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [oRes, wRes, pRes, cRes] = await Promise.all([
        buyerApi.getMyOrders(),
        buyerApi.getMyWishlist(),
        buyerApi.getMyProfile(),
        buyerApi.getMyCart(),
      ])
      setOrders(oRes.data.orders || [])
      setWishlist(wRes.data.items || [])
      setProfile(pRes.data.profile || null)
      setCart(cRes.data.cart || null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const refreshCart = useCallback(async () => {
    const res = await buyerApi.getMyCart()
    setCart(res.data.cart || null)
    return res.data.cart || null
  }, [])

  const addToCart = useCallback(async (productId, quantity = 1) => {
    await buyerApi.addToMyCart(productId, quantity)
    await refreshCart()
  }, [refreshCart])

  const updateCartItem = useCallback(async (productId, quantity) => {
    await buyerApi.updateMyCartItem(productId, quantity)
    await refreshCart()
  }, [refreshCart])

  const removeCartItem = useCallback(async (productId) => {
    await buyerApi.removeFromMyCart(productId)
    await refreshCart()
  }, [refreshCart])

  // Only resets what is on screen. The saved cart on the server is emptied by
  // the backend when the order is created, so this does not need an API call.
  const clearCart = useCallback(() => {
    setCart(null)
  }, [])

  const toggleWishlist = useCallback(async (productId) => {
    const exists = wishlist.some((item) => item._id === productId)
    if (exists) {
      await buyerApi.removeFromMyWishlist(productId)
      setWishlist((prev) => prev.filter((item) => item._id !== productId))
      showToast('Removed from wishlist')
    } else {
      const res = await buyerApi.addToMyWishlist(productId)
      setWishlist(res.data.items || [])
      showToast('Added to wishlist')
    }
  }, [wishlist, showToast])

  const removeWishlistItem = useCallback(async (productId) => {
    await buyerApi.removeFromMyWishlist(productId)
    setWishlist((prev) => prev.filter((item) => item._id !== productId))
    showToast('Removed from wishlist')
  }, [showToast])

  const updateProfile = useCallback(async (payload) => {
    const res = await buyerApi.updateMyProfile(payload)
    setProfile(res.data.profile || null)
    showToast('Profile updated successfully!')
  }, [showToast])

  const value = useMemo(
    () => ({
      orders,
      wishlist,
      profile,
      cart,
      loading,
      error,
      toast,
      refresh,
      refreshCart,
      addToCart,
      updateCartItem,
      removeCartItem,
      clearCart,
      toggleWishlist,
      removeWishlistItem,
      updateProfile,
    }),
    [orders, wishlist, profile, cart, loading, error, toast, refresh, refreshCart,
     addToCart, updateCartItem, removeCartItem, clearCart, toggleWishlist, removeWishlistItem, updateProfile]
  )

  return <BuyerContext.Provider value={value}>{children}</BuyerContext.Provider>
}

export function useBuyer() {
  const ctx = useContext(BuyerContext)
  if (!ctx) throw new Error('useBuyer must be used within BuyerProvider')
  return ctx
}
