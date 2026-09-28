export const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1610033311645-5c61f4b6a2d4?w=600&q=80'

export const CATEGORIES = [
  'Kanchipuram',
  'Banarasi',
  'Mysore',
  'Patola',
  'Pochampally',
  'Paithani',
]

export function productImage(product) {
  if (!product) return PLACEHOLDER_IMAGE
  if (Array.isArray(product.images) && product.images.length > 0) return product.images[0]
  if (product.image) return product.image
  return PLACEHOLDER_IMAGE
}

export function productGallery(product) {
  const images = Array.isArray(product?.images) && product.images.length > 0 ? product.images : []
  return images.length > 0 ? images : [PLACEHOLDER_IMAGE]
}

export function manufacturerName(product) {
  return product?.manufacturer?.name || 'WeaveConnect Artisan'
}

export function productLink(product) {
  if (!product?._id) return '/products'
  return `/product/${product._id}`
}

const BUYER_APP = (import.meta.env.VITE_BUYER_APP_URL || 'http://localhost:3000').replace(/\/+$/, '')

/**
 * The seller app has no product detail route, so "View" sends the seller to the
 * public storefront copy of the same product in a new tab.
 */
export function publicProductUrl(product) {
  if (!product?._id) return `${BUYER_APP}/products`
  return `${BUYER_APP}/product/${product._id}`
}

export function availabilityLabel(product) {
  const stock = product?.stock ?? 0
  if (stock === 0) return { label: 'Out of Stock', tone: 'out' }
  if (stock <= 5) return { label: `Only ${stock} left`, tone: 'low' }
  return { label: 'In Stock', tone: 'in' }
}

export const STATUS_ACTIVE = 'Active'
export const STATUS_LOW_STOCK = 'Low Stock'
export const STATUS_OUT_OF_STOCK = 'Out of Stock'

/**
 * The status shown in seller tables. Only "Out of Stock" is something a seller
 * can persist (as isAvailable = false); "Low Stock" is derived from the
 * quantity, so the Product model itself has no `status` field.
 */
export function productStatus(product) {
  if (product?.isAvailable === false || (product?.stock ?? 0) <= 0) return STATUS_OUT_OF_STOCK
  if (product.stock <= 5) return STATUS_LOW_STOCK
  return STATUS_ACTIVE
}
