import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useBuyer } from '../../context/BuyerContext'
import { formatINR } from '../../utils/format'
import { productImage, productLink } from '../../utils/product'
import { IconTrash, IconArrowRight } from '../../components/ui/Icons'
import { EmptyState, ErrorState } from '../../components/ui/States'

export default function BuyerCart() {
  const { cart, updateCartItem, removeCartItem } = useBuyer()
  const [busyId, setBusyId] = useState(null)
  const [actionError, setActionError] = useState('')

  const items = cart?.items || []
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0),
    [items]
  )

  // The server is the real authority on stock, but capping the button here
  // avoids a guaranteed 400 round-trip every time a shopper over-clicks.
  const changeQty = async (item, quantity) => {
    const product = item.product
    if (!product || quantity < 1) return
    if (quantity > product.stock) {
      setActionError(`Only ${product.stock} left of ${product.name}.`)
      return
    }
    setActionError('')
    setBusyId(product._id)
    try {
      await updateCartItem(product._id, quantity)
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (item) => {
    setActionError('')
    setBusyId(item.product?._id)
    try {
      await removeCartItem(item.product?._id)
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  if (!cart) {
    return <div className="bd-content-message">Loading your cart…</div>
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        message="Beautiful handwoven sarees are waiting for you."
        action={{ label: 'Browse Collection', to: '/products' }}
      />
    )
  }

  return (
    <div className="bd-cart">
      <section className="bd-card">
        <div className="bd-card-header">
          <h2>Shopping Cart</h2>
          <span className="bd-card-count">{items.length} items</span>
        </div>
        {actionError && <ErrorState compact title="Cart not updated" message={actionError} />}
        <div className="bd-cart-items">
          {items.map((item) => {
            const product = item.product
            if (!product) {
              return (
                <div key={item._id} className="bd-cart-item bd-cart-item-unavailable">
                  <div className="bd-cart-img">
                    <img src={productImage(null)} alt="Unavailable product" />
                  </div>
                  <div className="bd-cart-info">
                    <h3>Product no longer available</h3>
                    <span className="bd-rec-cat">Removed from store</span>
                  </div>
                  <div className="bd-cart-qty">
                    <span>Qty: {item.quantity}</span>
                  </div>
<div className="bd-cart-line-total">{formatINR((item.product?.price || 0) * item.quantity)}</div>
                  <button type="button" className="bd-wish-remove" onClick={() => remove(item)} title="Remove">
                    <IconTrash size={16} />
                  </button>
                </div>
              )
            }
            return (
              <div key={item._id} className="bd-cart-item">
                <Link to={productLink(product?._id)} className="bd-cart-img">
                  <img src={productImage(product)} alt="" />
                </Link>
                <div className="bd-cart-info">
                  <span className="bd-rec-cat">{product?.category}</span>
                  <h3><Link to={productLink(product?._id)}>{product?.name || 'Product'}</Link></h3>
                  <div className="bd-cart-meta">
                    <span>{formatINR(item.product?.price || 0)}</span>
                    {product?.stock <= 5 && product?.stock > 0 && <span className="bd-rec-discount">Only {product.stock} left</span>}
                  </div>
                </div>
                <div className="bd-cart-qty">
                  <button type="button" disabled={busyId === product?._id || item.quantity <= 1} onClick={() => changeQty(item, item.quantity - 1)}>−</button>
                  <span>{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => changeQty(item, item.quantity + 1)}
                    title={product.stock > 0 ? `Only ${product.stock} in stock` : 'Out of stock'}
                    disabled={busyId === product?._id || item.quantity >= (product?.stock ?? 0)}
                  >
                    +
                  </button>
                </div>
                <div className="bd-cart-line-total">{formatINR((item.product?.price || 0) * item.quantity)}</div>
                <button type="button" className="bd-wish-remove" onClick={() => remove(item)} title="Remove" disabled={busyId === product?._id}>
                  <IconTrash size={16} />
                </button>
              </div>
            )
          })}
        </div>
      </section>

      <section className="bd-card bd-cart-summary">
        <h2>Order Summary</h2>
        <div className="bd-cart-totals">
          <div><span>Subtotal</span><strong>{formatINR(subtotal)}</strong></div>
          <div><span>Delivery</span><strong>Free</strong></div>
        </div>
        <div className="bd-cart-grand">
          <span>Total</span>
          <strong>{formatINR(subtotal)}</strong>
        </div>
        <Link to="/buyer/checkout" className="bd-checkout-btn">
          Proceed to Checkout <IconArrowRight size={16} />
        </Link>
      </section>
    </div>
  )
}
