import api from './client'

export function getStoreProducts({ page = 1, limit = 24, search = '', category = '' } = {}) {
  const params = { page, limit }
  if (search) params.search = search
  if (category) params.category = category
  return api.get('/products', { params })
}

export function getStoreProduct(id) {
  return api.get(`/products/${id}`)
}

export function getMyOrders() {
  return api.get('/orders')
}

export function getMyOrder(id) {
  return api.get(`/orders/${id}`)
}

export function createMyOrder(items, shippingAddress) {
  return api.post('/orders', { items, shippingAddress, paymentMethod: 'cod' })
}

export function getMyCart() {
  return api.get('/cart')
}

export function addToMyCart(productId, quantity = 1) {
  return api.post('/cart/add', { productId, quantity })
}

export function updateMyCartItem(productId, quantity) {
  return api.put('/cart/update', { productId, quantity })
}

export function removeFromMyCart(productId) {
  return api.delete(`/cart/remove/${productId}`)
}

export function getMyWishlist() {
  return api.get('/wishlist')
}

export function addToMyWishlist(productId) {
  return api.post(`/wishlist/${productId}`)
}

export function removeFromMyWishlist(productId) {
  return api.delete(`/wishlist/${productId}`)
}

export function getMyProfile() {
  return api.get('/profile')
}

export function updateMyProfile(payload) {
  return api.patch('/profile', payload)
}
