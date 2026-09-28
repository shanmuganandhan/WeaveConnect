import api from './client'

export function getAdminUsers() {
  return api.get('/admin/users')
}

export function getAdminManufacturers() {
  return api.get('/admin/manufacturers')
}

export function getAdminPendingManufacturers() {
  return api.get('/admin/manufacturers/pending')
}

export function getAdminBuyers() {
  return api.get('/admin/buyers')
}

export function getAdminProducts() {
  return api.get('/admin/products')
}

export function getAdminOrders() {
  return api.get('/admin/orders')
}

export function getAdminAnalytics() {
  return api.get('/admin/analytics')
}

export function getAdminSettings() {
  return api.get('/admin/settings')
}

export function updateAdminSettings(payload) {
  return api.patch('/admin/settings', payload)
}

export function adminDeleteProduct(id) {
  return api.delete(`/admin/product/${id}`)
}

export function adminDeleteUser(id) {
  return api.delete(`/admin/user/${id}`)
}

export function adminBlockUser(id) {
  return api.patch(`/admin/user/${id}/block`)
}

export function adminUnblockUser(id) {
  return api.patch(`/admin/user/${id}/unblock`)
}

export function adminApproveManufacturer(id) {
  return api.patch(`/admin/manufacturer/${id}/approve`)
}

export function adminDisapproveManufacturer(id) {
  return api.patch(`/admin/manufacturer/${id}/disapprove`)
}

export function adminRejectManufacturer(id) {
  return api.patch(`/admin/manufacturer/${id}/reject`)
}

export function adminUpdateOrderStatus(id, status) {
  return api.patch(`/admin/order/${id}/status`, { status })
}
