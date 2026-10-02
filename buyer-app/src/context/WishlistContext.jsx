import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'
import * as buyerApi from '../api/buyerApi'

/**
 * The wishlist lives here for the same reason the cart does: the "save" button
 * appears on the public product pages, which are rendered outside the /buyer
 * layout, so a buyer-scoped provider would not be mounted there. Keeping it at
 * the app level means the public pages and /buyer/wishlist always agree.
 *
 * These are the existing wishlist endpoints - no backend change.
 */

const WishlistContext = createContext(null)

function readWishlist(response) {
  const items = response?.data?.items
  return Array.isArray(items) ? items : []
}

export function WishlistProvider({ children }) {
  const { user, initializing } = useAuth()
  const [wishlist, setWishlist] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const isBuyer = user?.role === 'buyer'

  const refreshWishlist = useCallback(async () => {
    // Guests have no wishlist; the save button is hidden for them anyway.
    if (!isBuyer) {
      setWishlist([])
      setError('')
      setLoading(false)
      return []
    }
    setLoading(true)
    setError('')
    try {
      const response = await buyerApi.getMyWishlist()
      const next = readWishlist(response)
      setWishlist(next)
      return next
    } catch (err) {
      setError(err?.message || 'We could not load your wishlist.')
      return []
    } finally {
      setLoading(false)
    }
  }, [isBuyer])

  useEffect(() => {
    if (initializing) return
    refreshWishlist()
  }, [initializing, refreshWishlist])

  const toggleWishlist = useCallback(
    async (productId) => {
      if (!isBuyer || !productId) return null
      const exists = wishlist.some((item) => item._id === productId)
      try {
        if (exists) {
          await buyerApi.removeFromMyWishlist(productId)
          setWishlist((prev) => prev.filter((item) => item._id !== productId))
          return false
        }
        const response = await buyerApi.addToMyWishlist(productId)
        const next = readWishlist(response)
        // The add endpoint returns the whole list, but fall back to appending
        // the id so the button still flips if the payload shape ever changes.
        if (next.length) {
          setWishlist(next)
        } else {
          setWishlist((prev) => [...prev, { _id: productId }])
        }
        return true
      } catch (err) {
        throw new Error(err?.message || 'Could not update your wishlist.')
      }
    },
    [isBuyer, wishlist]
  )

  const removeWishlistItem = useCallback(async (productId) => {
    await buyerApi.removeFromMyWishlist(productId)
    setWishlist((prev) => prev.filter((item) => item._id !== productId))
  }, [])

  const isWishlisted = useCallback(
    (productId) => wishlist.some((item) => item._id === productId),
    [wishlist]
  )

  const value = useMemo(
    () => ({
      wishlist,
      wishlistCount: wishlist.length,
      wishlistLoading: loading,
      wishlistError: error,
      refreshWishlist,
      toggleWishlist,
      removeWishlistItem,
      isWishlisted,
    }),
    [wishlist, loading, error, refreshWishlist, toggleWishlist, removeWishlistItem, isWishlisted]
  )

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider')
  return ctx
}
