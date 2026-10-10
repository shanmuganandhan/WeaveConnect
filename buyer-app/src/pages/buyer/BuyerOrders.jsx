import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useBuyer } from '../../context/BuyerContext'
import { useAuth } from '../../context/AuthContext'
import { payOnline, reportPaymentFailure } from '../../utils/razorpay'
import { formatINR } from '../../utils/format'
import { formatDate, orderId } from '../../utils/date'
import { productImage, productLink } from '../../utils/product'
import { IconPackage, IconArrowRight, IconChevronDown } from '../../components/ui/Icons'
import { EmptyState, ErrorState } from '../../components/ui/States'
import { SkeletonList } from '../../components/ui/Skeleton'
import './BuyerOrders.css'

const FILTERS = ['All', 'Pending', 'Accepted', 'Shipped', 'Delivered', 'Cancelled']

// The backend stores lowercase enum values; these are the labels a shopper
// should actually read.
const STATUS_LABELS = {
  pending: 'Pending',
  accepted: 'Accepted',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

// A short, factual description of what each status means. No promises about
// how fast anything will happen - just what the record says.
const STATUS_HINTS = {
  pending: 'Sent to the manufacturer. Waiting for them to accept it.',
  accepted: 'The manufacturer accepted this order.',
  shipped: 'Marked as shipped by the manufacturer.',
  delivered: 'Marked as delivered.',
  cancelled: 'This order was cancelled.',
}

// The backend enforces exactly this list on every cancel request; the button
// below merely mirrors it so shoppers are not sent into a guaranteed failure.
const CANCELLABLE_STATUSES = ['pending', 'accepted']

const PAYMENT_METHOD_LABELS = {
  razorpay: 'Online payment (Razorpay)',
  cod: 'Cash on delivery',
}

const REFUND_LABELS = {
  not_requested: 'Not requested',
  pending: 'Refund pending',
  processed: 'Refund processed',
  failed: 'Refund failed',
}

function OrderRow({ order, expanded, onToggle, highlight, onCancel, onPay }) {
  const items = Array.isArray(order.items) ? order.items : []
  const firstProduct = items[0]?.product
  const extra = items.length - 1
  const status = order.status || 'pending'

  const [confirming, setConfirming] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState('')
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState('')

  const canCancel = CANCELLABLE_STATUSES.includes(status)
  // Online orders that were created but never completed: the amount is still
  // owed, so the shopper can finish the payment straight from here.
  const canPay =
    order.paymentMethod === 'razorpay' &&
    order.paymentStatus !== 'paid' &&
    CANCELLABLE_STATUSES.includes(status)

  const handlePay = async () => {
    if (paying) return
    setPayError('')
    setPaying(true)
    try {
      await onPay(order._id)
    } catch (err) {
      if (err?.code === 'PAYMENT_DISMISSED') {
        await reportPaymentFailure(order._id)
        setPayError('Payment was closed. Nothing was charged - you can try again.')
      } else {
        setPayError(err?.message || 'We could not complete the payment. Please try again.')
      }
    } finally {
      setPaying(false)
    }
  }

  const handleConfirmCancel = async () => {
    if (cancelling) return
    setCancelError('')
    setCancelling(true)
    try {
      await onCancel(order._id)
      setConfirming(false)
    } catch (err) {
      // Status may have moved on (shipped, already cancelled, ...) since the
      // page loaded - the server's reason is shown and nothing changes.
      setCancelError(err?.message || 'We could not cancel this order. Please refresh.')
    } finally {
      setCancelling(false)
    }
  }

  return (
    <article className={`order-row${highlight ? ' order-row-highlight' : ''}`}>
      <div className="order-row-main">
        <div className="order-row-thumb">
          <img src={productImage(firstProduct)} alt="" loading="lazy" />
          {extra > 0 && <span className="order-row-more">+{extra}</span>}
        </div>

        <div className="order-row-info">
          <h3>{firstProduct?.name || 'Order items'}</h3>
          <p className="order-row-meta">
            #{orderId(order._id)} · {formatDate(order.createdAt)} ·{' '}
            {items.length} {items.length === 1 ? 'saree' : 'sarees'}
          </p>
          <span className={`order-status order-status-${status}`}>
            {STATUS_LABELS[status] || status}
          </span>
        </div>

        <div className="order-row-right">
          <span className="order-row-total">{formatINR(order.totalAmount)}</span>
          <button
            type="button"
            className="order-toggle"
            onClick={onToggle}
            aria-expanded={expanded}
            aria-controls={`order-details-${order._id}`}
          >
            {expanded ? 'Hide details' : 'View details'}
            <span className="order-toggle-icon" aria-hidden="true">
              <IconChevronDown size={16} />
            </span>
          </button>
          {canPay && (
            <button
              type="button"
              className="order-pay-btn"
              onClick={handlePay}
              disabled={paying || confirming}
            >
              {paying ? 'Opening payment…' : `Pay ${formatINR(order.totalAmount)}`}
            </button>
          )}
          {canCancel && !confirming && (
            <button
              type="button"
              className="order-cancel-btn"
              onClick={() => {
                setCancelError('')
                setConfirming(true)
              }}
            >
              Cancel Order
            </button>
          )}
        </div>
      </div>

      {payError && (
        <p className="order-pay-error" role="alert">
          {payError}
        </p>
      )}

      {confirming && (
        <div
          className="order-confirm"
          role="alertdialog"
          aria-labelledby={`cancel-title-${order._id}`}
          aria-describedby={`cancel-text-${order._id}`}
        >
          <div className="order-confirm-text">
            <strong id={`cancel-title-${order._id}`}>Cancel this order?</strong>
            <p id={`cancel-text-${order._id}`}>
              Are you sure you want to cancel this order? Returned stock goes back
              to the manufacturer's listing straight away.
            </p>
            {cancelError && (
              <p className="order-confirm-error" role="alert">
                {cancelError}
              </p>
            )}
          </div>
          <div className="order-confirm-actions">
            <button
              type="button"
              className="order-confirm-keep"
              onClick={() => setConfirming(false)}
              disabled={cancelling}
            >
              Cancel
            </button>
            <button
              type="button"
              className="order-confirm-go"
              onClick={handleConfirmCancel}
              disabled={cancelling}
            >
              {cancelling ? 'Cancelling…' : 'Confirm Cancellation'}
            </button>
          </div>
        </div>
      )}

      {expanded && (
        <div className="order-details" id={`order-details-${order._id}`}>
          <p className="order-details-hint">{STATUS_HINTS[status] || ''}</p>

          <h4>Items</h4>
          <ul className="order-details-items">
            {items.map((item, index) => {
              const product = item.product
              return (
                <li key={item._id || product?._id || index}>
                  <img src={productImage(product)} alt="" loading="lazy" />
                  <div className="order-details-item-info">
                    {product?._id ? (
                      <Link to={productLink(product)}>{product?.name || 'Saree'}</Link>
                    ) : (
                      <span>{product?.name || 'This product is no longer listed'}</span>
                    )}
                    <span>
                      {formatINR(item.price)} × {item.quantity}
                    </span>
                  </div>
                  <strong>{formatINR((Number(item.price) || 0) * (Number(item.quantity) || 1))}</strong>
                </li>
              )
            })}
          </ul>

          <div className="order-details-grid">
            <div>
              <h4>Delivery address</h4>
              <address className="order-address">
                {order.shippingAddress?.name}<br />
                {order.shippingAddress?.phone}<br />
                {order.shippingAddress?.addressLine1}<br />
                {order.shippingAddress?.addressLine2 && <>{order.shippingAddress.addressLine2}<br /></>}
                {order.shippingAddress?.city}
                {order.shippingAddress?.city && order.shippingAddress?.state ? ', ' : ''}
                {order.shippingAddress?.state}
                {order.shippingAddress?.zip && <> – {order.shippingAddress.zip}</>}
              </address>
            </div>

            <div>
              <h4>Payment</h4>
              <dl className="order-payment">
                <div>
                  <dt>Method</dt>
                  <dd>{PAYMENT_METHOD_LABELS[order.paymentMethod] || 'Cash on delivery'}</dd>
                </div>
                <div>
                  <dt>Payment status</dt>
                  <dd className="order-payment-status">{order.paymentStatus || 'pending'}</dd>
                </div>
                {order.refundStatus && order.refundStatus !== 'not_requested' && (
                  <div>
                    <dt>Refund</dt>
                    <dd className="order-payment-status">
                      {REFUND_LABELS[order.refundStatus] || order.refundStatus}
                    </dd>
                  </div>
                )}
                <div>
                  <dt>Order total</dt>
                  <dd>{formatINR(order.totalAmount)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      )}
    </article>
  )
}

export default function BuyerOrders() {
  const { orders, loading, error, refresh, cancelOrder } = useBuyer()
  const { user } = useAuth()
  const [params] = useSearchParams()
  const [filter, setFilter] = useState('All')
  const [expandedId, setExpandedId] = useState(null)

  const placed = params.get('placed')
  const paid = params.get('paid')
  const list = Array.isArray(orders) ? orders : []

  // Finishes an online payment for an order that already exists. The server
  // re-creates (or reuses) its Razorpay order and verifies the signature.
  const handlePay = async (id) => {
    const order = await payOnline({ orderId: id, buyer: user })
    await refresh()
    return order
  }

  const filtered = useMemo(() => {
    if (filter === 'All') return list
    return list.filter((o) => (o.status || '').toLowerCase() === filter.toLowerCase())
  }, [list, filter])

  const counts = useMemo(() => {
    const map = { All: list.length }
    list.forEach((o) => {
      const key = STATUS_LABELS[o.status] || o.status
      map[key] = (map[key] || 0) + 1
    })
    return map
  }, [list])

  if (loading && list.length === 0) {
    return (
      <div className="orders-page">
        <SkeletonList rows={3} />
      </div>
    )
  }

  if (error && list.length === 0) {
    return (
      <div className="orders-page">
        <ErrorState title="We could not load your orders" message={error} onRetry={refresh} />
      </div>
    )
  }

  return (
    <div className="orders-page">
      {placed && (
        <div className="order-placed-banner" role="status">
          <IconPackage size={20} />
          <div>
            {paid ? (
              <>
                <strong>Payment received - your order is confirmed.</strong>
                {placed !== 'true' && (
                  <span> Your order reference is {orderId(placed)}. </span>
                )}
                The manufacturer has been notified and will accept it shortly.
              </>
            ) : (
              <>
                <strong>Order placed.</strong>
                {placed !== 'true' && (
                  <span> Your order reference is {orderId(placed)}. </span>
                )}
                It is now pending until the manufacturer accepts it.
              </>
            )}
          </div>
        </div>
      )}

      <header className="orders-header">
        <div>
          <h1>My Orders</h1>
          <p className="orders-sub">
            {list.length} {list.length === 1 ? 'order' : 'orders'} placed
          </p>
        </div>
        <Link to="/products" className="orders-back">
          Continue shopping <IconArrowRight size={16} />
        </Link>
      </header>

      {list.length === 0 ? (
        <EmptyState
          icon={<IconPackage size={30} />}
          title="No orders yet"
          message="When you place an order it will appear here with its current status."
          action={{ label: 'Browse Collection', to: '/products' }}
        />
      ) : (
        <>
          <div className="orders-chips" role="group" aria-label="Filter orders by status">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                className={`orders-chip${filter === f ? ' active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f}
                <span className="orders-chip-count">{counts[f] || 0}</span>
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={<IconPackage size={26} />}
              title={`No ${filter.toLowerCase()} orders`}
              message="Try a different status filter to see your other orders."
              action={{ label: 'Show all orders', onClick: () => setFilter('All') }}
            />
          ) : (
            <div className="orders-list">
              {filtered.map((order) => (
                <OrderRow
                  key={order._id}
                  order={order}
                  highlight={placed && order._id === placed}
                  expanded={expandedId === order._id}
                  onToggle={() => setExpandedId((prev) => (prev === order._id ? null : order._id))}
                  onCancel={cancelOrder}
                  onPay={handlePay}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
