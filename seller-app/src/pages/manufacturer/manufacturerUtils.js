import { productImage, productStatus } from '../../utils/product'

// Single source of truth lives in utils/product.js so components and pages
// cannot drift apart on what "Out of Stock" means.
export { productStatus }

export function initials(name) {
  return (name || 'M')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

export function titleCase(str) {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function toViewProduct(p) {
  return {
    id: p._id,
    name: p.name,
    category: p.category,
    price: p.price,
    stock: p.stock,
    sold: p.soldCount || 0,
    status: productStatus(p),
    image: productImage(p),
    description: p.description || '',
    images: Array.isArray(p.images) ? p.images : [],
  }
}

export function toPayload(view) {
  return {
    name: view.name,
    description: view.description || '',
    category: view.category,
    price: view.price,
    stock: view.stock,
    isAvailable: view.status !== 'Out of Stock',
    images: view.images || [],
  }
}

export function orderCustomer(o) {
  return o.buyer?.name || 'Customer'
}

export function orderProducts(o) {
  return (o.items || []).map((i) => i.product?.name || 'Product').join(', ')
}

export function orderQuantity(o) {
  if (o && o.ownQuantity !== undefined) return o.ownQuantity
  return (o.items || []).reduce((sum, i) => sum + (i.quantity || 1), 0)
}

export function orderAmount(o) {
  if (o && o.ownAmount !== undefined) return o.ownAmount
  return o.totalAmount || 0
}
