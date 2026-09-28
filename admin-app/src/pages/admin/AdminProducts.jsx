import { useState } from 'react'
import { useAdmin } from '../../context/AdminContext'
import { formatINR } from '../../utils/format'
import { productImage } from '../../utils/product'
import { IconTrash } from '../../components/ui/Icons'
import { STATUS_COLORS, productStatus } from './adminUtils'

export default function Products() {
  const { products, deleteProduct } = useAdmin()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const filtered = products.filter((p) => {
    const status = productStatus(p)
    const matchSearch =
      (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'All' || status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h2>Products ({filtered.length})</h2>
        <div className="admin-page-filters">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-search"
          />
          <div className="admin-filter-chips">
            {['All', 'Active', 'Low Stock', 'Out of Stock'].map((s) => (
              <button
                key={s}
                className={`admin-chip ${statusFilter === s ? 'active' : ''}`}
                onClick={() => setStatusFilter(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Manufacturer</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const status = productStatus(p)
              return (
                <tr key={p._id}>
                  <td className="admin-table-name">
                    <div className="admin-product-cell">
                      <img src={productImage(p)} alt={p.name} className="admin-product-img" />
                      {p.name}
                    </div>
                  </td>
                  <td>{p.category}</td>
                  <td className="admin-table-sub">{p.manufacturer?.name || '—'}</td>
                  <td>{formatINR(p.price)}</td>
                  <td>{p.stock}</td>
                  <td>
                    <span className="admin-status-badge" style={{ color: STATUS_COLORS[status.toLowerCase()] || '#9c8a6b' }}>
                      {status}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="admin-delete-btn"
                      onClick={() => {
                        if (window.confirm(`Delete product "${p.name}"? This cannot be undone.`)) deleteProduct(p._id)
                      }}
                      aria-label={`Delete ${p.name}`}
                    >
                      <IconTrash size={15} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="admin-empty">No products found.</div>}
      </div>
    </div>
  )
}
