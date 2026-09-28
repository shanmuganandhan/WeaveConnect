import { useState } from 'react'
import { useAdmin } from '../../context/AdminContext'
import { formatINR } from '../../utils/format'
import { formatDate, orderId } from '../../utils/date'
import { STATUS_COLORS, titleCase, orderProducts, orderAmount } from './adminUtils'

const ORDER_FILTERS = ['All', 'pending', 'accepted', 'shipped', 'delivered', 'cancelled']

const NEXT_STATUS = {
  pending: ['accepted', 'cancelled'],
  accepted: ['shipped', 'cancelled'],
  shipped: ['delivered'],
}

export default function Orders() {
  const { orders, updateOrderStatus } = useAdmin()
  const [statusFilter, setStatusFilter] = useState('All')

  const filtered = orders.filter((o) => statusFilter === 'All' || o.status === statusFilter)

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h2>Orders ({filtered.length})</h2>
        <div className="admin-filter-chips">
          {ORDER_FILTERS.map((s) => (
            <button
              key={s}
              className={`admin-chip ${statusFilter === s ? 'active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'All' ? 'All' : titleCase(s)}
            </button>
          ))}
        </div>
      </div>
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date</th>
              <th>Buyer</th>
              <th>Product</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o._id}>
                <td className="admin-table-name">{orderId(o._id)}</td>
                <td>{formatDate(o.createdAt)}</td>
                <td>{o.buyer?.name || 'Buyer'}</td>
                <td className="admin-table-sub">{orderProducts(o)}</td>
                <td>{formatINR(orderAmount(o))}</td>
                <td>
                  <span className="admin-status-badge" style={{ color: STATUS_COLORS[o.status] || '#9c8a6b' }}>
                    {titleCase(o.status)}
                  </span>
                </td>
                <td>
                  {NEXT_STATUS[o.status] ? (
                    <div className="admin-row-actions">
                      {NEXT_STATUS[o.status].map((s) => (
                        <button
                          key={s}
                          type="button"
                          className="admin-chip"
                          onClick={() => {
                            if (window.confirm(`Mark order ${orderId(o._id)} as "${titleCase(s)}"?`)) updateOrderStatus(o._id, s)
                          }}
                        >
                          {titleCase(s)}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="admin-table-sub">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="admin-empty">No orders found.</div>}
      </div>
    </div>
  )
}
