import { useState, useMemo, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { getProducts } from '../api/products'
import { CATEGORIES, productImage, productImageCount, productLink } from '../utils/product'
import { formatINR } from '../utils/format'
import { useAddToCart } from '../hooks/useAddToCart'
import useEscape from '../hooks/useEscape'
import { SkeletonGrid } from './ui/Skeleton'
import { EmptyState, ErrorState } from './ui/States'
import { PhotoCountBadge } from './ui/PhotoCountBadge'
import Stars from './ui/Stars'
import Toast from './ui/Toast'
import { useToast } from '../hooks/useToast'
import './Products.css'

const pageSize = 8

function Products() {
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState('')
  // The text box updates instantly, but the API call waits for a short pause in
  // typing. Without this, every single keystroke would send a request.
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [category, setCategory] = useState(() => {
    const fromUrl = params.get('category')
    return fromUrl && CATEGORIES.includes(fromUrl) ? fromUrl : 'All'
  })
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sortBy, setSortBy] = useState('featured')
  const [page, setPage] = useState(1)
  const [wishlist, setWishlist] = useState({})
  const [quickView, setQuickView] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { toast, showToast } = useToast()
  const addToCart = useAddToCart(showToast)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getProducts({
        search: debouncedSearch.trim(),
        category: category === 'All' ? '' : category,
        limit: 100,
      })
      setProducts(res.data.products || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, category])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Wait 350ms after the last keystroke, then update the value the API uses.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(timer)
  }, [search])

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      const matchesMin = minPrice === '' || p.price >= Number(minPrice)
      const matchesMax = maxPrice === '' || p.price <= Number(maxPrice)
      return matchesMin && matchesMax
    })

    switch (sortBy) {
      case 'price-asc':
        list = [...list].sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        list = [...list].sort((a, b) => b.price - a.price)
        break
      case 'name':
        list = [...list].sort((a, b) => a.name.localeCompare(b.name))
        break
      default:
        list = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }
    return list
  }, [products, minPrice, maxPrice, sortBy])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  useEffect(() => {
    setPage(1)
  }, [search, category, minPrice, maxPrice, sortBy])

  useEffect(() => {
    if (category === 'All') {
      if (params.has('category')) setParams({}, { replace: true })
    } else if (params.get('category') !== category) {
      setParams({ category }, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category])

  const toggleWishlist = (id) => {
    const next = !wishlist[id]
    setWishlist((prev) => ({ ...prev, [id]: next }))
    showToast(next ? 'Added to wishlist' : 'Removed from wishlist')
  }

  useEscape(() => setQuickView(null))

  const resetFilters = () => {
    setSearch('')
    setCategory('All')
    setMinPrice('')
    setMaxPrice('')
    setSortBy('featured')
  }

  const hasActiveFilters =
    search !== '' || category !== 'All' || minPrice !== '' || maxPrice !== ''

  const goToPage = useCallback((p) => {
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const categories = ['All', ...CATEGORIES]

  return (
    <section className="products-page" aria-labelledby="products-title">
      <Toast toast={toast} />

      <div className="products-header">
        <div className="products-header-bg"></div>
        <div className="products-header-content">
          <span className="pl-badge">Our Collection</span>
          <h1 id="products-title">Silk Saree Collection</h1>
          <p>Authentic handwoven sarees from India's master weaving traditions</p>
        </div>
      </div>

      <div className="products-container">
        <div className="products-toolbar">
          <div className="pl-search">
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="search"
              placeholder="Search sarees, weaves, regions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search products"
            />
            {search && (
              <button className="pl-search-clear" onClick={() => setSearch('')} aria-label="Clear search">
                <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          <div className="pl-categories" role="tablist" aria-label="Category filter">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                role="tab"
                aria-selected={category === c}
                className={`pl-cat-chip ${category === c ? 'active' : ''}`}
                onClick={() => setCategory(c)}
              >
                {c === 'All' ? 'All Sarees' : c}
              </button>
            ))}
          </div>

          <div className="pl-controls">
            <div className="pl-price-filter">
              <label className="pl-control-label">
                <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                Price
              </label>
              <div className="pl-price-inputs">
                <div className="pl-price-field">
                  <span>₹</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    aria-label="Minimum price"
                  />
                </div>
                <span className="pl-price-dash">–</span>
                <div className="pl-price-field">
                  <span>₹</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    aria-label="Maximum price"
                  />
                </div>
              </div>
            </div>

            <div className="pl-sort">
              <label className="pl-control-label">
                <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="4" y1="21" x2="4" y2="14" />
                  <line x1="4" y1="10" x2="4" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12" y2="3" />
                  <line x1="20" y1="21" x2="20" y2="16" />
                  <line x1="20" y1="12" x2="20" y2="3" />
                  <line x1="1" y1="14" x2="7" y2="14" />
                  <line x1="9" y1="8" x2="15" y2="8" />
                  <line x1="17" y1="16" x2="23" y2="16" />
                </svg>
                Sort
              </label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort products">
                <option value="featured">Newest First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name">Name A–Z</option>
              </select>
            </div>
          </div>

          <div className="pl-result-row">
            <p className="pl-results" aria-live="polite">
              Showing <strong>{paged.length}</strong> of <strong>{filtered.length}</strong> sarees
              {hasActiveFilters && (
                <button type="button" className="pl-reset" onClick={resetFilters}>
                  Reset filters
                </button>
              )}
            </p>
            <p className="pl-wishlist-count" aria-live="polite">
              {Object.values(wishlist).filter(Boolean).length} in wishlist
            </p>
          </div>
        </div>

        {loading ? (
          <SkeletonGrid count={8} footer />
        ) : error ? (
          <ErrorState
            title="Could not load products"
            message={error}
            onRetry={fetchProducts}
          />
        ) : paged.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="No sarees found"
            message="Try adjusting your search, price range or category."
            actionLabel="Clear all filters"
            onAction={resetFilters}
          />
        ) : (
          <div className="pl-grid">
            {paged.map((product, index) => {
              const isWishlisted = !!wishlist[product._id]
              const available = product.stock > 0
              return (
                <article key={product._id} className="pl-card" style={{ '--index': index }}>
                  <div className="pl-card-image">
                    <img src={productImage(product)} alt={product.name} loading="lazy" />
                    {!available && <span className="pl-badge">Sold Out</span>}
                    <PhotoCountBadge count={productImageCount(product)} className="pl-photo-count" />
                    <button
                      type="button"
                      className={`pl-wishlist ${isWishlisted ? 'active' : ''}`}
                      onClick={() => toggleWishlist(product._id)}
                      aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
                      aria-pressed={isWishlisted}
                    >
                      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill={isWishlisted ? '#d64545' : 'none'} stroke={isWishlisted ? '#d64545' : 'currentColor'} strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </button>
                    <div className="pl-quickview-wrap">
                      <button type="button" className="pl-quickview" onClick={() => setQuickView(product)}>
                        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        Quick View
                      </button>
                    </div>
                  </div>
                  <div className="pl-card-body">
                    <span className="pl-category">{product.category} Silk</span>
                    <h3 className="pl-name">
                      <a href={productLink(product)} className="pl-name-link">{product.name}</a>
                    </h3>
                    {product.totalReviews > 0 ? (
                      <div className="pl-card-rating">
                        <Stars rating={product.averageRating} size={13} reviewsText={`(${product.totalReviews})`} />
                      </div>
                    ) : (
                      <span className="pl-card-no-rating">No reviews yet</span>
                    )}
                    <p className="pl-desc">{product.description || 'Handwoven pure silk saree.'}</p>
                    <div className="pl-pricing">
                      <span className="pl-price">{formatINR(product.price)}</span>
                    </div>
                    <div className="pl-card-actions">
                      <Link to="/buyer/cart" className="pl-btn-cart">
                        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                          <line x1="3" y1="6" x2="21" y2="6" />
                          <path d="M16 10a4 4 0 0 1 4 4v4" />
                        </svg>
                        Go to Cart
                      </Link>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {totalPages > 1 && (
          <nav className="pl-pagination" aria-label="Pagination">
            <button
              type="button"
              className="pl-page-btn"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                className={`pl-page-btn ${p === currentPage ? 'active' : ''}`}
                onClick={() => goToPage(p)}
                aria-current={p === currentPage ? 'page' : undefined}
                aria-label={`Page ${p}`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              className="pl-page-btn"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </nav>
        )}
      </div>

      {quickView && (
        <div className="pl-modal-overlay" onClick={() => setQuickView(null)} role="dialog" aria-modal="true" aria-labelledby="quickview-title">
          <div className="pl-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="pl-modal-close" onClick={() => setQuickView(null)} aria-label="Close quick view">
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div className="pl-modal-image">
              <img src={productImage(quickView)} alt={quickView.name} />
              {quickView.stock <= 0 && <span className="pl-badge">Sold Out</span>}
            </div>
            <div className="pl-modal-body">
              <span className="pl-category">{quickView.category} Silk</span>
              <h3 id="quickview-title">{quickView.name}</h3>
              <p className="pl-modal-desc">{quickView.description || 'Handwoven pure silk saree.'}</p>
              <div className="pl-pricing">
                <span className="pl-price">{formatINR(quickView.price)}</span>
              </div>
              <ul className="pl-modal-features">
                <li>100% pure handwoven silk</li>
                <li>Certificate of authenticity included</li>
                <li>Free insured shipping worldwide</li>
                <li>7-day easy returns</li>
              </ul>
              <div className="pl-modal-actions">
                <button
                  type="button"
                  className={`btn-pl-secondary ${wishlist[quickView._id] ? 'wishlisted' : ''}`}
                  onClick={() => toggleWishlist(quickView._id)}
                >
                  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill={wishlist[quickView._id] ? '#d64545' : 'none'} stroke={wishlist[quickView._id] ? '#d64545' : 'currentColor'} strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  {wishlist[quickView._id] ? 'Wishlisted' : 'Add to Wishlist'}
                </button>
                <button
                  type="button"
                  className="btn-pl-primary"
                  disabled={quickView.stock <= 0}
                  onClick={() => { addToCart(quickView); setQuickView(null) }}
                >
                  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1 4 4v4" />
                  </svg>
                  Add to Cart
                </button>
                <a href={productLink(quickView)} className="btn-pl-secondary pl-view-details">
                  View Full Details
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default Products
