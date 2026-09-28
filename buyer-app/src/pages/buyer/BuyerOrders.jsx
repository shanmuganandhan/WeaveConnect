import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useBuyer } from '../../context/BuyerContext'
import { formatINR } from '../../utils/format'
import { formatDate, orderId } from '../../utils/date'
import { productImage, productLink } from '../../utils/product'
import { IconPackage, IconCheck } from '../../components/ui/Icons'
import { EmptyState } from '../../components/ui/States'

const FILTERS = ['All', 'Pending', 'Accepted', 'Shipped', 'Delivered', 'Cancelled']

export default function BuyerOrders() {
  const { orders } = useBuyer()
  const [params] = useSearchParams()
  const [filter, setFilter] = useState('All')

  const placed = params.get('placed')

  const filtered = useMemo(() => {
    if (filter === 'All') return orders
    return orders.filter((o) => o.status.toLowerCase() === filter.toLowerCase())
  }, [orders, filter])

  const counts = useMemo(() => {
    const map = { All: orders.length }
    orders.forEach((o) => {
      const key = o.status.charAt(0).toUpperCase() + o.status.slice(1)
      map[key] = (map[key] || 0) + 1
    })
    return map
  }, [orders])

  return (
    <div className="bd-orders-page">
      {placed && (
        <div className="bd-order-success">
          <IconCheck size={20} />
          Order placed successfully! The weaver will accept it shortly.
        </div>
      )}

      <section className="bd-card">
        <div className="bd-card-header">
          <h2>My Orders</h2>
          <span className="bd-card-count">{orders.length} total</span>
        </div>

        <div className="bd-chips" role="group" aria-label="Order filter">
          {FILTERS.map((f) => (
            <button key={f} type="button" className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>
              {f} <span className="bd-chip-count">{counts[f] || 0}</span>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<IconPackage size={32} />}
            title="No orders here"
            message="Orders you place will appear in this list."
            action={{ label: 'Browse Collection', to: '/products' }}
          />
        ) : (
          <div className="bd-orders-list">
            {filtered.map((order) => {
              const product = order.items?.[0]?.product
              return (
                <div key={order._id} className="bd-order-row">
                  <img className="bd-order-img" src={productImage(product)} alt="" />
                  <div className="bd-order-info">
                    <h3>{product?.name || 'Order items'}</h3>
                    <span className="bd-order-id">
                      #{orderId(order._id)} · {formatDate(order.createdAt)} · {order.items?.length || 0} item(s)
                    </span>
                  </div>
                  <div className="bd-order-right">
                    <span className="bd-order-price">{formatINR(order.totalAmount)}</span>
                    <span className={`bd-status bd-status-${order.status === 'pending' || order.status === 'accepted' ? 'processing' : order.status}`}>
                      {order.status}
                    </span>
                    {product && (
                      <span className="bd-order-delivery">
                        <Link to={productLink(product._id)}>View saree →</Link>
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
