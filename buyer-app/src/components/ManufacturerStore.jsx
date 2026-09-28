import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getStore, getStoreProducts } from '../api/stores'
import { CATEGORIES, productImage, productImageCount, productLink, availabilityLabel } from '../utils/product'
import { formatINR } from '../utils/format'
import { formatDate } from '../utils/date'
import Stars from './ui/Stars'
import { PhotoCountBadge } from './ui/PhotoCountBadge'
import { EmptyState, ErrorState } from './ui/States'
import { SkeletonGrid } from './ui/Skeleton'
import { IconStore, IconSearch, IconX } from './ui/Icons'
import './ManufacturerStore.css'

// Public storefront of one seller: who they are, how buyers rate them, and the
// sarees they currently have on sale. No login is needed to view this page.
function ManufacturerStore() {
  const { id: storeId } = useParams()

  const [store, setStore] = useState(null)
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    setNotFound(false)
    setStore(null)
    setProducts([])
    setSearch('')
    setCategory('All')

    getStore(storeId)
      .then((res) => {
        if (!active) return
        setStore(res.data.store)
        return getStoreProducts(storeId)
      })
      .then((res) => {
        if (!active || !res) return
        setProducts(res.data.products || [])
      })
      .catch((err) => {
        if (!active) return
        // The API returns 404 when the seller does not exist, is blocked, or has
        // not been approved yet. All three mean the same thing to a shopper.
        if (err.status === 404) setNotFound(true)
        else setError(err.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [storeId])

  // Only the categories this seller actually sells are worth showing.
  const availableCategories = useMemo(() => {
    const used = new Set(products.map((p) => p.category))
    return CATEGORIES.filter((c) => used.has(c))
  }, [products])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return products.filter((p) => {
      const matchesCategory = category === 'All' || p.category === category
      const matchesSearch =
        !term ||
        p.name.toLowerCase().includes(term) ||
        (p.description || '').toLowerCase().includes(term)
      return matchesCategory && matchesSearch
    })
  }, [products, search, category])

  if (loading) {
    return (
      <section className="st-page">
        <div className="st-container">
          <div className="st-hero st-hero-skeleton" />
          <SkeletonGrid count={4} />
        </div>
      </section>
    )
  }

  if (notFound) {
    return (
      <section className="st-page">
        <div className="st-container">
          <EmptyState
            icon={<IconStore size={40} />}
            title="This store is not available"
            message="The seller may have removed their store, or it is still waiting for approval."
            action={{ label: 'Back to Collection', to: '/products' }}
          />
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="st-page">
        <div className="st-container">
          <ErrorState title="Could not load this store" message={error} onRetry={() => window.location.reload()} />
        </div>
      </section>
    )
  }

  if (!store) return null

  return (
    <section className="st-page" aria-labelledby="st-title">
      <div className="st-container">
        <nav className="st-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span className="st-sep">/</span>
          <Link to="/products">Collection</Link>
          <span className="st-sep">/</span>
          <span className="st-current">Store</span>
        </nav>

        <header className="st-hero">
          <div className="st-hero-avatar" aria-hidden="true">
            <IconStore size={34} />
          </div>
          <div className="st-hero-body">
            <h1 id="st-title">{store.businessName}</h1>
            <p className="st-hero-sub">
              {store.name}
              {store.city && (
                <>
                  {' · '}
                  {store.city}
                  {store.state ? `, ${store.state}` : ''}
                </>
              )}
            </p>
            {store.description && <p className="st-hero-desc">{store.description}</p>}
            <div className="st-hero-stats">
              <span className="st-stat">
                <strong>{store.productCount}</strong> Saree{store.productCount === 1 ? '' : 's'}
              </span>
              {store.totalReviews > 0 ? (
                <span className="st-stat st-stat-rating">
                  <Stars rating={store.averageRating} size={14} />
                  {store.averageRating.toFixed(1)} ({store.totalReviews} review{store.totalReviews > 1 ? 's' : ''})
                </span>
              ) : (
                <span className="st-stat">
                  <strong>New</strong> Seller
                </span>
              )}
              {store.memberSince && (
                <span className="st-stat">
                  <strong>Since</strong> {formatDate(store.memberSince)}
                </span>
              )}
            </div>
          </div>
        </header>

        {products.length === 0 ? (
          <EmptyState
            icon={<IconStore size={40} />}
            title="No sarees on sale right now"
            message="This seller has not listed any products at the moment. Please check back soon."
            action={{ label: 'Browse the full collection', to: '/products' }}
          />
        ) : (
          <>
            <div className="st-toolbar">
              <div className="st-search">
                <IconSearch size={18} />
                <input
                  type="search"
                  placeholder={`Search in ${store.businessName}`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label={`Search in ${store.businessName}`}
                />
                {search && (
                  <button type="button" onClick={() => setSearch('')} aria-label="Clear search">
                    <IconX size={16} />
                  </button>
                )}
              </div>

              {availableCategories.length > 1 && (
                <div className="st-categories">
                  {['All', ...availableCategories].map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`st-chip ${category === c ? 'active' : ''}`}
                      onClick={() => setCategory(c)}
                      aria-pressed={category === c}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <p className="st-result-count">
              Showing {filtered.length} of {products.length} item{products.length === 1 ? '' : 's'}
            </p>

            {filtered.length === 0 ? (
              <EmptyState
                compact
                title="No matching sarees"
                message="Try a different search term or clear the filters."
                actionLabel="Clear filters"
                onAction={() => {
                  setSearch('')
                  setCategory('All')
                }}
              />
            ) : (
              <div className="st-grid">
                {filtered.map((product) => {
                  const availability = availabilityLabel(product)
                  return (
                    <article key={product._id} className="st-card">
                      <Link to={productLink(product)} className="st-card-image" aria-label={`View ${product.name}`}>
                        <img src={productImage(product)} alt={product.name} loading="lazy" />
                        {availability.tone === 'out' && <span className="st-badge">Sold Out</span>}
                        <PhotoCountBadge count={productImageCount(product)} className="st-photo-count" />
                      </Link>
                      <div className="st-card-body">
                        <span className="st-card-category">{product.category} Silk</span>
                        <h3 className="st-card-name">
                          <Link to={productLink(product)}>{product.name}</Link>
                        </h3>
                        {product.totalReviews > 0 && (
                          <div className="st-card-rating">
                            <Stars
                              rating={product.averageRating}
                              size={13}
                              reviewsText={`(${product.totalReviews})`}
                            />
                          </div>
                        )}
                        <div className="st-card-foot">
                          <span className="st-card-price">{formatINR(product.price)}</span>
                          <span className={`st-stock st-stock-${availability.tone}`}>{availability.label}</span>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}

export default ManufacturerStore
