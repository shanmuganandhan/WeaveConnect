import api from './client'

// search   - matches the product name, the category or the description
// category - exact category name
// manufacturer - only products from this seller (used by the store page)
export async function getProducts({ page = 1, limit = 24, search = '', category = '', manufacturer = '' } = {}) {
  const params = { page, limit }

  if (search) params.search = search
  if (category) params.category = category
  if (manufacturer) params.manufacturer = manufacturer

  return await api.get('/products', { params })
}

export async function getProduct(id) {
  return await api.get(`/products/${id}`)
}

export async function createProduct(payload) {
  return await api.post('/products', payload)
}

export async function updateProduct(id, payload) {
  return await api.put(`/products/${id}`, payload)
}

export async function deleteProduct(id) {
  return await api.delete(`/products/${id}`)
}