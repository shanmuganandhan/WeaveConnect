import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as buyerApi from '../api/buyerApi'
import { useCart } from './CartContext'
import { useWishlist } from './WishlistContext'
import { useToast } from '../hooks/useToast'

const BuyerContext = createContext(null)

/**
 * Account-level data for the signed-in buyer: orders, profile, and re-exposed
 * cart/wishlist state.
 *
 * The cart lives in CartContext and the wishlist lives in WishlistContext -
 * both providers are mounted at the app level because their buttons also appear
 * on the public product pages, which render outside the /buyer layout. They are
 * re-exposed here so every buyer page can keep reading everything from one hook
 * and the header badge, the product page and the account pages can never
 * disagree.
 */
export function BuyerProvider({ children }) {
  const cartCtx = useCart()
  const { cart, itemCount, totalQuantity, subtotal, loading: cartLoading, error: cartError,
    refreshCart, addItem, updateItem, removeItem, clearCart } = cartCtx
  const wishCtx = useWishlist()
  const { wishlist, toggleWishlist: toggleWishlistBase, removeWishlistItem } = wishCtx

  const [orders, setOrders] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { toast, showToast } = useToast()

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    // allSettled instead of all: a single failing endpoint (say, the profile)
    // should not leave the buyer looking at an empty orders list. Each section
    // falls back to empty, and the error message says what could not be read.
    const [oRes, pRes] = await Promise.allSettled([
      buyerApi.getMyOrders(),
      buyerApi.getMyProfile(),
    ])

    if (oRes.status === 'fulfilled') setOrders(oRes.value?.data?.orders || [])
    if (pRes.status === 'fulfilled') setProfile(pRes.value?.data?.profile || null)

    const failures = [oRes, pRes].filter((r) => r.status === 'rejected')
    setError(
      failures.length
        ? failures.map((f) => f.reason?.message).filter(Boolean)[0] ||
            'We could not load your account right now.'
        : ''
    )
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const addToCart = useCallback((productId, quantity = 1) => addItem(productId, quantity), [addItem])
  const updateCartItem = useCallback(
    (productId, quantity) => updateItem(productId, quantity),
    [updateItem]
  )
  const removeCartItem = useCallback((productId) => removeItem(productId), [removeItem])

  const toggleWishlist = useCallback(
    async (productId) => {
      try {
        const added = await toggleWishlistBase(productId)
        if (added !== null) showToast(added ? 'Added to wishlist' : 'Removed from wishlist')
        return added
      } catch (err) {
        showToast(err?.message || 'Could not update your wishlist', 'error')
        return null
      }
    },
    [toggleWishlistBase, showToast]
  )

  const removeWishlistItemWithToast = useCallback(
    async (productId) => {
      try {
        await removeWishlistItem(productId)
        showToast('Removed from wishlist')
      } catch (err) {
        showToast(err?.message || 'Could not update your wishlist', 'error')
      }
    },
    [removeWishlistItem, showToast]
  )

  const updateProfile = useCallback(async (payload) => {
    const res = await buyerApi.updateMyProfile(payload)
    setProfile(res?.data?.profile || null)
    showToast('Profile updated successfully!')
  }, [showToast])

  const value = useMemo(
    () => ({
      orders,
      wishlist,
      profile,
      // Cart (shared with the header through CartContext)
      cart,
      cartItemCount: itemCount,
      cartTotalQuantity: totalQuantity,
      cartSubtotal: subtotal,
      cartLoading,
      cartError,
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
      removeWishlistItem: removeWishlistItemWithToast,
      updateProfile,
    }),
    [orders, wishlist, profile, cart, itemCount, totalQuantity, subtotal, cartLoading, cartError,
      loading, error, toast, refresh, refreshCart, addToCart, updateCartItem, removeCartItem,
      clearCart, toggleWishlist, removeWishlistItemWithToast, updateProfile]
  )

  return <BuyerContext.Provider value={value}>{children}</BuyerContext.Provider>
}

export function useBuyer() {
  const ctx = useContext(BuyerContext)
  if (!ctx) throw new Error('useBuyer must be used within BuyerProvider')
  return ctx
}
