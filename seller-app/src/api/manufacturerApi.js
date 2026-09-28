import api from './client'

export function getMyProducts({ page = 1, limit = 100, search = '', category = '' } = {}) {
  const params = { page, limit }
  if (search) params.search = search
  if (category) params.category = category
  return api.get('/manufacturer/products', { params })
}

export function createMyProduct(payload) {
  return api.post('/manufacturer/products', payload)
}

export function updateMyProduct(id, payload) {
  return api.put(`/manufacturer/products/${id}`, payload)
}

export function deleteMyProduct(id) {
  return api.delete(`/manufacturer/products/${id}`)
}

export function uploadProductImages(files) {
  const formData = new FormData()
  files.forEach((file) => formData.append('images', file))
  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export function getMyOrders() {
  return api.get('/manufacturer/orders')
}

export function updateMyOrderStatus(id, status) {
  return api.patch(`/manufacturer/orders/${id}/status`, { status })
}

export function getManufacturerAnalytics() {
  return api.get('/manufacturer/analytics')
}

export function getMyProfile() {
  return api.get('/manufacturer/profile')
}

export function updateMyProfile(payload) {
  return api.patch('/manufacturer/profile', payload)
}
