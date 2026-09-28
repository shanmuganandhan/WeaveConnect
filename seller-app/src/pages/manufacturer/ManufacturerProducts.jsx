import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useManufacturer } from '../../context/ManufacturerContext'
import { formatINR } from '../../utils/format'
import { productImage, publicProductUrl } from '../../utils/product'
import { IconPlus, IconSearch, IconEdit, IconTrash, IconEye, IconPackage } from '../../components/ui/Icons'
import { EmptyState, ErrorState } from '../../components/ui/States'
import { ProductModal, DeleteConfirm } from '../../components/manufacturer/ProductForm'
import { productStatus, titleCase } from './manufacturerUtils'

const CATEGORIES = ['All', 'Kanchipuram', 'Banarasi', 'Mysore', 'Patola', 'Pochampally', 'Paithani']
const STATUS_FILTERS = ['All', 'Active', 'Low Stock', 'Out of Stock']

export default function ManufacturerProducts() {
  const { products, loading, error, refresh, deleteProduct, updateProduct, showToast } = useManufacturer()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products.filter((p) => {
      if (category !== 'All' && p.category !== category) return false
      if (statusFilter !== 'All' && productStatus(p) !== statusFilter) return false
      if (q && !`${p.name} ${p.category}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [products, search, category, statusFilter])

  if (loading) return <div className="md-page-title">Loading products…</div>
  if (error) return <ErrorState title="Couldn't load your products" message={error} onRetry={refresh} />

  const handleSave = async (payload) => {
    setEditing(null)
    try {
      await updateProduct(editing._id, payload)
    } catch (err) {
      showToast(err.message || 'Could not save this product', 'error')
    }
  }

  return (
    <div className="md-products-page">
      <div className="md-page-title">
        <div>
          <h1>My Products</h1>
          <span>{products.length} items in your store</span>
        </div>
        <Link to="/seller/products/add" className="md-btn-primary">
          <IconPlus size={18} /> Add Product
        </Link>
      </div>

      <div className="md-toolbar">
        <div className="md-search">
          <IconSearch size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or category…"
          />
        </div>
        <div className="md-chips" role="group" aria-label="Category filter">
          {CATEGORIES.map((c) => (
            <button key={c} type="button" className={`md-chip${category === c ? ' active' : ''}`} onClick={() => setCategory(c)}>
              {c}
            </button>
          ))}
        </div>
        <div className="md-chips" role="group" aria-label="Status filter">
          {STATUS_FILTERS.map((s) => (
            <button key={s} type="button" className={`md-chip${statusFilter === s ? ' active' : ''}`} onClick={() => setStatusFilter(s)}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<IconPackage size={32} />}
          title="No products found"
          message={products.length === 0 ? 'Add your first saree to start selling.' : 'Try a different search or filter.'}
          action={products.length === 0 ? { label: 'Add Product', to: '/seller/products/add' } : undefined}
        />
      ) : (
        <div className="md-table-wrap">
          <table className="md-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th className="md-cell-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const status = productStatus(p)
                return (
                  <tr key={p._id}>
                    <td>
                      <div className="md-product-cell">
                        <img src={productImage(p)} alt={p.name} />
                        <button type="button" className="md-link-btn" onClick={() => setEditing(p)}>
                          <strong>{p.name}</strong>
                        </button>
                      </div>
                    </td>
                    <td>{p.category}</td>
                    <td className="md-cell-amount">{formatINR(p.price)}</td>
                    <td>{p.stock}</td>
                    <td>
                      <span className={`md-status md-status-${status.toLowerCase().replace(/\s/g, '-')}`}>
                        {titleCase(status)}
                      </span>
                    </td>
                    <td className="md-cell-right">
                      <div className="md-row-actions">
                        <button
                          type="button"
                          className="md-icon-btn"
                          title="View on storefront"
                          onClick={() => window.open(publicProductUrl(p), '_blank', 'noopener,noreferrer')}
                        >
                          <IconEye size={16} />
                        </button>
                        <button type="button" className="md-icon-btn" onClick={() => setEditing(p)} title="Edit">
                          <IconEdit size={16} />
                        </button>
                        <button type="button" className="md-icon-btn danger" onClick={() => setDeleting(p)} title="Delete">
                          <IconTrash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <ProductModal
          product={editing}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      )}
      {deleting && (
        <DeleteConfirm
          product={deleting}
          onClose={() => setDeleting(null)}
          onConfirm={(id) => deleteProduct(id)}
        />
      )}
    </div>
  )
}
