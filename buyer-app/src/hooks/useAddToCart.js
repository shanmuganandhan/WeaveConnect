import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

/**
 * Single "add to cart" action used by the home page, the collection grid, the
 * quick view and the product page.
 *
 * It goes through CartContext.addItem, so the header badge updates in the same
 * tick the backend answers - no extra refresh request and no chance of the
 * badge and the cart page showing different counts.
 */
export function useAddToCart(showToast) {
  const { user } = useAuth()
  const { addItem } = useCart()
  const navigate = useNavigate()
  const location = useLocation()

  return useCallback(
    async (product, qty = 1) => {
      if (!user) {
        showToast('Please sign in to add items to your cart', 'error')
        // Come back to the page the shopper was looking at after signing in.
        const returnTo = encodeURIComponent(location.pathname + location.search)
        navigate(`/login?returnTo=${returnTo}`, { replace: false })
        return false
      }
      if (user.role !== 'buyer') {
        showToast('Only buyer accounts can add items to the cart', 'error')
        return false
      }
      if (product?.stock != null && Number(product.stock) < 1) {
        showToast(`${product.name} is out of stock`, 'error')
        return false
      }
      try {
        await addItem(product._id, qty)
        showToast(`${product.name} added to cart`)
        return true
      } catch (err) {
        showToast(err?.message || 'Could not add to cart', 'error')
        return false
      }
    },
    [user, addItem, showToast, navigate, location.pathname, location.search]
  )
}
