import api from './client'

export async function getProducts({ page = 1, limit = 24, search = '', category = '' } = {}) {
  const params = { page, limit }

  if (search) params.search = search
  if (category) params.category = category

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