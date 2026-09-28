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

export function productImageCount(product) {
  return Array.isArray(product?.images) ? product.images.length : 0
}

export function manufacturerName(product) {
  return product?.manufacturer?.name || 'WeaveConnect Artisan'
}

export function productLink(product) {
  if (!product?._id) return '/products'
  return `/product/${product._id}`
}

export function availabilityLabel(product) {
  const stock = product?.stock ?? 0
  if (stock === 0) return { label: 'Out of Stock', tone: 'out' }
  if (stock <= 5) return { label: `Only ${stock} left`, tone: 'low' }
  return { label: 'In Stock', tone: 'in' }
}
