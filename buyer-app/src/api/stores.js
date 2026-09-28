import api from './client'
import { getProducts } from './products'

// Public storefront of a seller. No login required.
export async function getStore(id) {
  return await api.get(`/stores/${id}`)
}

// The products a seller currently has on sale. This reuses the existing public
// products endpoint with the "manufacturer" filter, so there is only one place
// where product searching and filtering happens.
export async function getStoreProducts(id, { search = '', category = '' } = {}) {
  return await getProducts({ manufacturer: id, search, category, limit: 100 })
}
