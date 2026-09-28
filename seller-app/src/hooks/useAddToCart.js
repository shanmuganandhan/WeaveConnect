import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import * as buyerApi from '../api/buyerApi'

export function useAddToCart(showToast) {
  const { user } = useAuth()
  const navigate = useNavigate()

  return useCallback(
    async (product, qty = 1) => {
      if (!user) {
        showToast('Please sign in to add items to your cart', 'error')
        navigate('/login')
        return false
      }
      if (user.role !== 'buyer') {
        showToast('Only buyer accounts can add items to the cart', 'error')
        return false
      }
      try {
        await buyerApi.addToMyCart(product._id, qty)
        showToast(`${product.name} added to cart`)
        return true
      } catch (err) {
        showToast(err.message || 'Could not add to cart', 'error')
        return false
      }
    },
    [user, showToast, navigate]
  )
}
