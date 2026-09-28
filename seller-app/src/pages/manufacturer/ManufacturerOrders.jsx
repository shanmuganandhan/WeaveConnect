import { useMemo, useState } from 'react'
import { useManufacturer } from '../../context/ManufacturerContext'
import { formatINR } from '../../utils/format'
import { formatDate, orderId } from '../../utils/date'
import { IconPackage, IconChevronDown } from '../../components/ui/Icons'
import { EmptyState, ErrorState } from '../../components/ui/States'
import { titleCase, orderCustomer, orderProducts, orderQuantity, orderAmount } from './manufacturerUtils'

const STATUS_FILTERS = ['All', 'Pending', 'Accepted', 'Shipped', 'Delivered', 'Cancelled']
const MANUFACTURER_STATUSES = ['accepted', 'shipped', 'delivered']

export default function ManufacturerOrders() {
  const { orders, loading, error, refresh, updateOrderStatus } = useManufacturer()
  const [filter, setFilter] = useState('All')
  const [expanded, setExpanded] = useState(null)

  const filtered = useMemo(() => {
    if (filter === 'All') return orders
    return orders.filter((o) => titleCase(o.status) === filter)
  }, [orders, filter])

  const counts = useMemo(() => {
    const map = { All: orders.length }
    orders.forEach((o) => {
      map[titleCase(o.status)] = (map[titleCase(o.status)] || 0) + 1
    })
    return map
  }, [orders])

  if (loading) return <div className="md-page-title">Loading orders…</div>
  if (error) return <ErrorState title="Couldn't load orders" message={error} onRetry={refresh} />

  const handleStatus = (order, status) => {
    updateOrderStatus(order._id, status)
    setExpanded(null)
  }

  return (
    <div className="md-orders-page">
      <div className="md-page-title">
        <h1>Orders</h1>
        <span>{orders.length} total</span>
      </div>

      <div className="md-chips" role="group" aria-label="Order status filter">
        {STATUS_FILTERS.map((s) => (
          <button key={s} type="button" className={`md-chip${filter === s ? ' active' : ''}`} onClick={() => setFilter(s)}>
            {s} <span className="md-chip-count">{counts[s] || 0}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<IconPackage size={32} />} title="No orders here" message="Orders placed by buyers will appear here." />
      ) : (
        <div className="md-table-wrap">
          <table className="md-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Products</th>
                <th>Qty</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <OrderRow
                  key={order._id}
                  order={order}
                  expanded={expanded === order._id}
                  onToggle={() => setExpanded((prev) => (prev === order._id ? null : order._id))}
                  onStatus={handleStatus}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ShippingAddress({ address }) {
  if (!address) {
    return <p className="md-order-address">No shipping address provided.</p>
  }
  const name = address.name || address.fullName || ''
  const line1 = address.addressLine1 || address.address || ''
  const line2 = address.addressLine2 || ''
  const city = address.city || ''
  const state = address.state || ''
  const zip = address.zip || address.pincode || ''
  const phone = address.phone || ''

  if (!name && !line1 && !city) {
    return <p className="md-order-address">No shipping address provided.</p>
  }

  return (
    <p className="md-order-address">
      {name}
      {name ? <br /> : null}
      {line1}
      {line2 ? `, ${line2}` : ''}
      {line1 || line2 ? <br /> : null}
      {city}
      {city && state ? ', ' : ''}
      {state} {zip}
      {city || state || zip ? <br /> : null}
      {phone}
    </p>
  )
}

function OrderRow({ order, expanded, onToggle, onStatus }) {
  const canUpdate = MANUFACTURER_STATUSES.includes(order.status)
  return (
    <>
      <tr className="md-order-row" onClick={onToggle}>
        <td className="md-cell-order">
          {orderId(order._id)}
          <IconChevronDown size={14} className={`md-chevron ${expanded ? 'open' : ''}`} />
        </td>
        <td>
          <strong>{orderCustomer(order)}</strong>
          <small>{order.buyer?.email || ''}</small>
        </td>
        <td>{orderProducts(order)}</td>
        <td>{orderQuantity(order)}</td>
        <td className="md-cell-amount">{formatINR(orderAmount(order))}</td>
        <td>{formatDate(order.createdAt)}</td>
        <td>
          <span className={`md-status md-status-${order.status.toLowerCase()}`}>
            {titleCase(order.status)}
          </span>
        </td>
      </tr>
      {expanded && (
        <tr className="md-order-details-row">
          <td colSpan="7">
            <div className="md-order-details">
              <div>
                <h4>Items</h4>
                <ul>
                  {(order.items || []).map((item, i) => (
                    <li key={i}>
                      {item.product?.name || 'Product'} × {item.quantity}
                      <span>{formatINR(item.price)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4>Shipping Address</h4>
                <ShippingAddress address={order.shippingAddress} />
              </div>
              <div>
                <h4>Update Status</h4>
                {canUpdate ? (
                  <select className="md-select" value={order.status} onChange={(e) => onStatus(order, e.target.value)}>
                    <option value="accepted">Accepted</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                  </select>
                ) : (
                  <p className="md-order-address">
                    {order.status === 'cancelled'
                      ? 'This order was cancelled.'
                      : 'This order has been completed.'}
                  </p>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
