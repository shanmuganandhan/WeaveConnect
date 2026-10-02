import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { getProduct } from '../../api/products'
import { formatINR } from '../../utils/format'
import { productLink } from '../../utils/product'
import { cartLines, cartProductId } from '../../utils/cart'
import { IconTrash, IconArrowRight, IconPlus, IconAlert, IconBag } from '../../components/ui/Icons'
import { EmptyState, ErrorState } from '../../components/ui/States'
import { SkeletonList } from '../../components/ui/Skeleton'
import './BuyerCart.css'

export default function BuyerCart() {
  const { items, loading, error, refreshCart, updateItem, removeItem } = useCart()
  const [productIndex, setProductIndex] = useState(() => new Map())
  const [enriching, setEnriching] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [actionError, setActionError] = useState('')

  /**
   * GET /cart only populates name, price, images and manufacturer, so `stock`,
   * `category` and `isAvailable` are missing. Without them the quantity stepper
   * would have nothing to cap against and the cart could not show availability.
   *
   * The existing GET /products/:id endpoint returns the full record, so we ask
   * for exactly the products that are in this cart instead of paging the whole
   * catalog (which the backend caps at 100 rows and could silently truncate).
   * The server still re-validates every quantity change, so this is only for
   * display and for not sending requests that are bound to be rejected.
   */
  const loadProductDetails = useCallback(async () => {
    const ids = Array.from(
      new Set(items.map(cartProductId).filter(Boolean))
    )
    if (ids.length === 0) {
      setProductIndex(new Map())
      return
    }

    setEnriching(true)
    const results = await Promise.allSettled(ids.map((id) => getProduct(id)))

    // A single unreachable product must not hide the rest of the cart; that
    // line simply falls back to "stock unknown" and lets the server decide.
    const next = new Map()
    results.forEach((result) => {
      if (result.status !== 'fulfilled') return
      const product = result.value?.data?.product
      if (product?._id) next.set(product._id, product)
    })
    setProductIndex(next)
    setEnriching(false)
  }, [items])

  useEffect(() => {
    loadProductDetails()
  }, [loadProductDetails])

  const lines = useMemo(() => cartLines(items, productIndex), [items, productIndex])

  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0)
  const hasProblems = lines.some((line) => line.missing || line.available === false)

  const changeQty = async (line, quantity) => {
    if (quantity < 1) return
    // stock === null means we could not confirm it; let the server decide.
    if (line.stock !== null && quantity > line.stock) {
      setActionError(`Only ${line.stock} left of ${line.name}.`)
      return
    }
    setActionError('')
    setBusyId(line.productId)
    try {
      await updateItem(line.productId, quantity)
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (line) => {
    setActionError('')
    setBusyId(line.productId)
    try {
      await removeItem(line.productId)
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return (
      <div className="cart-page">
        <SkeletonList rows={3} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="cart-page">
        <ErrorState title="We could not load your cart" message={error} onRetry={refreshCart} />
      </div>
    )
  }

  if (lines.length === 0) {
    return (
      <div className="cart-page">
        <EmptyState
          icon={<IconBag size={30} />}
          title="Your cart is empty"
          message="Browse the collection and add the sarees you want - the order goes straight to the weaver."
          action={{ label: 'Browse Collection', to: '/products' }}
        />
      </div>
    )
  }

  return (
    <div className="cart-page">
      <header className="cart-header">
        <div>
          <h1>Shopping Cart</h1>
          <p className="cart-sub">
            {lines.length} {lines.length === 1 ? 'saree' : 'sarees'} in your cart
            {enriching && <span className="cart-sub-note"> · checking live stock…</span>}
          </p>
        </div>
        <Link to="/products" className="cart-back">Continue shopping</Link>
      </header>

      {actionError && (
        <div className="cart-alert" role="alert">
          <IconAlert size={16} />
          {actionError}
        </div>
      )}

      <div className="cart-layout">
        <section className="cart-items" aria-label="Cart items">
          {lines.map((line) => {
            const busy = busyId === line.productId
            const max = line.stock

            return (
              <article key={line.key} className={`cart-item${line.available === false ? ' cart-item-blocked' : ''}`}>
                <Link to={productLink(line.product)} className="cart-item-image">
                  <img src={line.image} alt={line.name} loading="lazy" />
                  {line.available === false && <span className="cart-item-badge">Out of stock</span>}
                </Link>

                <div className="cart-item-details">
                  <div className="cart-item-top">
                    {line.category && <span className="cart-item-category">{line.category}</span>}
                    {line.manufacturer && <span className="cart-item-maker">{line.manufacturer}</span>}
                  </div>

                  <h3 className="cart-item-name">
                    {line.missing ? (
                      <span>{line.name}</span>
                    ) : (
                      <Link to={productLink(line.product)}>{line.name}</Link>
                    )}
                  </h3>

                  <div className="cart-item-stock">
                    {line.missing && <span className="cart-stock-unknown">This product is no longer listed</span>}
                    {!line.missing && line.available === false && (
                      <span className="cart-stock-unknown">Currently unavailable - please remove it to continue</span>
                    )}
                    {!line.missing && line.available !== false && max !== null && max <= 5 && (
                      <span className="cart-stock-low">Only {max} left in stock</span>
                    )}
                    {!line.missing && line.available !== false && max === null && (
                      <span className="cart-stock-unknown">Stock is confirmed when you update the quantity</span>
                    )}
                  </div>

                  <div className="cart-item-bottom">
                    <div className="cart-qty-controls" aria-label={`Quantity for ${line.name}`}>
                      <button
                        type="button"
                        className="cart-qty-btn"
                        onClick={() => changeQty(line, line.quantity - 1)}
                        disabled={busy || line.quantity <= 1}
                        aria-label="Decrease quantity"
                      >
                        &minus;
                      </button>
                      <span className="cart-qty-value" aria-live="polite">
                        {busy ? '…' : line.quantity}
                      </span>
                      <button
                        type="button"
                        className="cart-qty-btn"
                        onClick={() => changeQty(line, line.quantity + 1)}
                        disabled={busy || line.available === false || (max !== null && line.quantity >= max)}
                        aria-label="Increase quantity"
                        title={max !== null ? `${max} in stock` : undefined}
                      >
                        <IconPlus size={15} />
                      </button>
                    </div>

                    <div className="cart-item-pricing">
                      <span className="cart-price">{formatINR(line.lineTotal)}</span>
                      {line.quantity > 1 && (
                        <span className="cart-price-each">{formatINR(line.price)} each</span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="cart-item-remove"
                  onClick={() => remove(line)}
                  disabled={busy}
                  title={busy ? 'Working…' : `Remove ${line.name} from cart`}
                  aria-label={`Remove ${line.name} from cart`}
                >
                  <IconTrash size={16} />
                </button>
              </article>
            )
          })}
        </section>

        <aside className="cart-summary" aria-label="Order summary">
          <h2>Order Summary</h2>

          <div className="cart-summary-rows">
            <div className="cart-summary-row">
              <span>Subtotal</span>
              <strong>{formatINR(subtotal)}</strong>
            </div>
            <div className="cart-summary-row">
              <span>Payment method</span>
              <strong>Cash on delivery</strong>
            </div>
          </div>

          <div className="cart-summary-total">
            <span>Total payable</span>
            <strong>{formatINR(subtotal)}</strong>
          </div>

          {hasProblems && (
            <p className="cart-summary-warning">
              Remove the unavailable items above before checking out.
            </p>
          )}

          {hasProblems ? (
            <button type="button" className="cart-checkout-btn" disabled>
              Resolve unavailable items
            </button>
          ) : (
            <Link to="/buyer/checkout" className="cart-checkout-btn">
              Proceed to Checkout
              <IconArrowRight size={17} />
            </Link>
          )}

          <p className="cart-summary-note">
            There is no separate delivery charge - the amount above is the order total.
          </p>
        </aside>
      </div>
    </div>
  )
}
