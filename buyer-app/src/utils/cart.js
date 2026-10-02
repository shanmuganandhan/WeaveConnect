import { productImage } from './product'

/**
 * Helpers for turning the cart document returned by GET /api/cart into
 * something the UI can render safely.
 *
 * Important backend detail: the cart controller populates each item with
 * `select: 'name price images manufacturer'`. That means `category`, `stock`
 * and `isAvailable` are NOT part of the cart payload. Anything the cart screen
 * shows about stock or category has to come from the products endpoint instead.
 */

export function cartProductId(item) {
  return item?.product?._id || null
}

export function cartItemCount(items) {
  return (Array.isArray(items) ? items : []).length
}

export function cartTotalQuantity(items) {
  return (Array.isArray(items) ? items : []).reduce(
    (sum, item) => sum + (Number(item?.quantity) || 0),
    0
  )
}

export function cartSubtotal(items) {
  return (Array.isArray(items) ? items : []).reduce(
    (sum, item) => sum + (Number(item?.product?.price) || 0) * (Number(item?.quantity) || 0),
    0
  )
}

/**
 * Turn raw cart items into display-ready lines.
 *
 * `stock` is `null` when we could not confirm it from the products endpoint,
 * which the UI treats as "unknown" rather than "out of stock" - the server is
 * still the authority and rejects impossible quantities.
 */
export function cartLines(items, productIndex) {
  return (Array.isArray(items) ? items : []).map((item, index) => {
    const productId = cartProductId(item)
    const full = productIndex?.get(productId) || null
    const base = item?.product || null
    const product = full || base
    const quantity = Math.max(1, Number(item?.quantity) || 1)
    const price = Number(product?.price) || 0

    return {
      key: item?._id || productId || `cart-item-${index}`,
      itemId: item?._id || null,
      productId,
      product,
      name: product?.name || 'This saree is no longer listed',
      category: product?.category || '',
      image: productImage(product),
      manufacturer: product?.manufacturer?.name || '',
      price,
      quantity,
      stock: full ? Number(full.stock) || 0 : null,
      available: full ? full.isAvailable !== false && (Number(full.stock) || 0) > 0 : null,
      lineTotal: price * quantity,
      missing: !product,
    }
  })
}
