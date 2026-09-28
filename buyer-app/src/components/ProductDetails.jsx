import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { getProduct, getProducts } from '../api/products'
import { formatINR } from '../utils/format'
import { productImage, manufacturerName, productLink } from '../utils/product'
import { formatDate } from '../utils/date'
import Toast from './ui/Toast'
import { useToast } from '../hooks/useToast'
import { useAddToCart } from '../hooks/useAddToCart'
import { SkeletonCard } from './ui/Skeleton'
import { ErrorState } from './ui/States'
import ProductImageCarousel from './ProductImageCarousel'
import ProductReviews from './ProductReviews'
import Stars from './ui/Stars'
import './ProductDetails.css'

function StockBadge({ stock }) {
  if (stock === 0) {
    return (
      <span className="pd-stock pd-stock-out">
        <span className="pd-stock-dot"></span> Out of Stock
      </span>
    )
  }
  if (stock <= 5) {
    return (
      <span className="pd-stock pd-stock-low">
        <span className="pd-stock-dot"></span> Only {stock} left in stock!
      </span>
    )
  }
  return (
    <span className="pd-stock pd-stock-in">
      <span className="pd-stock-dot"></span> In Stock · Ships in 24-48 hrs
    </span>
  )
}

function ProductDetails() {
  const { id: productId } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [qty, setQty] = useState(1)
  const [activeTab, setActiveTab] = useState('description')
  const { toast, showToast } = useToast()
  const addToCart = useAddToCart(showToast)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    setProduct(null)
    setQty(1)

    getProduct(productId)
      .then((res) => {
        if (!active) return
        const p = res.data.product
        setProduct(p)
        setRelated([])
        return getProducts({ category: p.category, limit: 100 })
          .then((rel) => {
            if (!active) return
            const siblings = (rel.data.products || []).filter((r) => r._id !== p._id).slice(0, 4)
            setRelated(siblings)
          })
          .catch(() => {
            setRelated([])
          })
      })
      .catch((err) => {
        if (active) setError(err.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [productId])

  if (loading) {
    return (
      <section className="pd-page">
        <div className="pd-container">
          <div className="pd-loading-grid">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </section>
    )
  }

  if (error && !product) {
    return (
      <section className="pd-page pd-notfound">
        <div className="pd-container">
          <ErrorState
            title="Could not load this saree"
            message={error}
            onRetry={() => window.location.reload()}
          />
        </div>
      </section>
    )
  }

  if (!product) {
    return (
      <section className="pd-page pd-notfound">
        <div className="pd-container">
          <div className="pd-notfound-box">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
            <h1>Product not found</h1>
            <p>The saree you're looking for may have been moved or sold out.</p>
            <Link to="/products" className="pd-btn-primary">Back to Collection</Link>          </div>
        </div>
      </section>
    )
  }

  const outOfStock = product.stock === 0
  const mfgName = manufacturerName(product)

  const handleAddToCart = async () => {
    if (outOfStock) return
    const ok = await addToCart(product, qty)
    if (ok) setActiveTab('description')
  }

  const handleBuyNow = async () => {
    if (outOfStock) return
    const ok = await addToCart(product, qty)
    if (ok) {
      navigate('/buyer/cart')
    }
  }

  const changeQty = (delta) => {
    setQty((prev) => Math.min(Math.max(prev + delta, 1), Math.max(product.stock, 1)))
  }

  return (
    <section className="pd-page" aria-labelledby="pd-title">
      <div className="pd-container">
        <nav className="pd-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span className="pd-breadcrumb-sep">/</span>
          <Link to="/products">Collection</Link>
          <span className="pd-breadcrumb-sep">/</span>
          <Link to="/products" className="pd-breadcrumb-cat">{product.category} Silk</Link>
          <span className="pd-breadcrumb-sep">/</span>
          <span className="pd-breadcrumb-current">{product.name}</span>
        </nav>

        <div className="pd-layout">
          <div className="pd-gallery">
            <ProductImageCarousel
              key={product._id}
              product={product}
              className="pd-main-image"
              overlay={!outOfStock && product.stock <= 5
                ? <span className="pd-badge">Only {product.stock} left</span>
                : null}
              zoomHint={(
                <span className="pd-zoom-hint">
                  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="11" y1="8" x2="11" y2="14" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                  </svg>
                  Hover to zoom
                </span>
              )}
            />
          </div>

          <div className="pd-info">
            <span className="pd-category">{product.category} Silk</span>
            <h1 id="pd-title" className="pd-title">{product.name}</h1>

            <div className="pd-price-row">
              <span className="pd-price">{formatINR(product.price)}</span>
              <button
                type="button"
                className="pd-rating-summary"
                onClick={() => setActiveTab('reviews')}
                aria-label={`Rated ${product.averageRating || 0} out of 5 from ${product.totalReviews || 0} reviews. Go to reviews.`}
              >
                <Stars rating={product.averageRating || 0} size={15} />
                <span className="pd-rating-count">
                  {product.totalReviews > 0
                    ? `${(product.averageRating || 0).toFixed(1)} · ${product.totalReviews} review${product.totalReviews > 1 ? 's' : ''}`
                    : 'No reviews yet'}
                </span>
              </button>
            </div>

            <p className="pd-description">{product.description || `Handcrafted by master weavers using techniques passed down through generations, this ${product.category} silk saree embodies the artistry of India's handloom tradition.`}</p>

            <div className="pd-qty-row">
              <div className="pd-qty-block">
                <span className="pd-label">Quantity</span>
                <div className="pd-qty">
                  <button type="button" onClick={() => changeQty(-1)} disabled={qty <= 1} aria-label="Decrease quantity">
                    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                  <span className="pd-qty-value">{qty}</span>
                  <button type="button" onClick={() => changeQty(1)} disabled={outOfStock || qty >= product.stock} aria-label="Increase quantity">
                    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                </div>
              </div>
              <StockBadge stock={product.stock} />
            </div>

            <div className="pd-actions">
              <button
                type="button"
                className="pd-btn-cart"
                onClick={handleAddToCart}
                disabled={outOfStock}
              >
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1 4 4v4" />
                </svg>
                {outOfStock ? 'Out of Stock' : 'Add to Cart'}
              </button>
              <button
                type="button"
                className="pd-btn-buy"
                onClick={handleBuyNow}
                disabled={outOfStock}
              >
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Buy Now
              </button>
            </div>

            <ul className="pd-trust">
              <li>
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Authenticity certificate included
              </li>
              <li>
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="3" width="15" height="13" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
                Free insured worldwide shipping
              </li>
              <li>
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 18" />
                  <path d="M21 12v9H3V6" />
                  <path d="M3 6l3-3h6l3 3" />
                </svg>
                7-day easy returns
              </li>
            </ul>
          </div>
        </div>

        <div className="pd-tabs">
          <div className="pd-tab-list" role="tablist" aria-label="Product information">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'description'}
              className={`pd-tab ${activeTab === 'description' ? 'active' : ''}`}
              onClick={() => setActiveTab('description')}
            >
              Description
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'specs'}
              className={`pd-tab ${activeTab === 'specs' ? 'active' : ''}`}
              onClick={() => setActiveTab('specs')}
            >
              Specifications
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'manufacturer'}
              className={`pd-tab ${activeTab === 'manufacturer' ? 'active' : ''}`}
              onClick={() => setActiveTab('manufacturer')}
            >
              Manufacturer
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'reviews'}
              className={`pd-tab ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              Reviews{product.totalReviews > 0 ? ` (${product.totalReviews})` : ''}
            </button>
          </div>

          <div className="pd-tab-panel" role="tabpanel">
            {activeTab === 'description' && (
              <div className="pd-panel-inner">
                <h2>About this saree</h2>
                <p>
                  {product.description || `Handcrafted by master weavers using techniques passed down through generations, this ${product.category} silk saree embodies the artistry of India's handloom tradition. Each saree takes 7-14 days to complete on a traditional handloom, ensuring every thread tells a story of dedication and craft.`}
                </p>
                <div className="pd-note">
                  <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  Minor variations in colour and motif are inherent to handwoven textiles and
                  add to each piece's uniqueness.
                </div>
              </div>
            )}

            {activeTab === 'specs' && (
              <div className="pd-panel-inner">
                <h2>Specifications</h2>
                <div className="pd-specs">
                  <div className="pd-spec">
                    <span className="pd-spec-label">Category</span>
                    <span className="pd-spec-value">{product.category} Silk</span>
                  </div>
                  <div className="pd-spec">
                    <span className="pd-spec-label">Price</span>
                    <span className="pd-spec-value">{formatINR(product.price)}</span>
                  </div>
                  <div className="pd-spec">
                    <span className="pd-spec-label">Stock</span>
                    <span className="pd-spec-value">{product.stock > 0 ? `${product.stock} available` : 'Out of stock'}</span>
                  </div>
                  <div className="pd-spec">
                    <span className="pd-spec-label">Listed On</span>
                    <span className="pd-spec-value">{formatDate(product.createdAt) || '—'}</span>
                  </div>
                  <div className="pd-spec">
                    <span className="pd-spec-label">Length</span>
                    <span className="pd-spec-value">6.3 m + blouse piece</span>
                  </div>
                  <div className="pd-spec">
                    <span className="pd-spec-label">Care</span>
                    <span className="pd-spec-value">Dry clean only</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'manufacturer' && (
              <div className="pd-panel-inner">
                <h2>Manufacturer Information</h2>
                <div className="pd-manufacturer">
                  <div className="pd-mfg-avatar">
                    <svg aria-hidden="true" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <line x1="3" y1="3" x2="3" y2="21" />
                      <line x1="21" y1="3" x2="21" y2="21" />
                      <line x1="5" y1="8" x2="19" y2="8" />
                      <line x1="5" y1="13" x2="19" y2="13" />
                      <line x1="5" y1="18" x2="19" y2="18" />
                    </svg>
                  </div>
                  <div className="pd-mfg-details">
                    <div className="pd-mfg-name-row">
                      <h3>{mfgName}</h3>
                      <span className="pd-verified">
                        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        Verified
                      </span>
                    </div>
                    <p className="pd-mfg-desc">
                      A registered WeaveConnect artisan partner empowering local weaving
                      families through fair-trade partnerships.
                    </p>
                    <div className="pd-mfg-stats">
                      <span>
                        <strong>Direct</strong> Fair-trade sourcing
                      </span>
                      <span>
                        <strong>Handloom</strong> Certified craft
                      </span>
                      <span>
                        <strong>{product.stock}</strong> Units in stock
                      </span>
                    </div>
                    {product.manufacturer?._id && (
                      <Link to={`/store/${product.manufacturer._id}`} className="pd-store-link">
                        Visit {product.manufacturer.name || 'this seller'}'s store
                        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="pd-panel-inner pd-panel-reviews">
                <ProductReviews productId={product._id} />
              </div>
            )}
          </div>
        </div>

        {related.length > 0 && (
          <div className="pd-related">
            <div className="pd-related-header">
              <span className="pd-related-badge">You May Also Like</span>
              <h2>Related Sarees</h2>
            </div>
            <div className="pd-related-grid">
              {related.map((item) => (
                <article key={item._id} className="pd-rel-card">
                  <a href={productLink(item)} className="pd-rel-image" aria-label={`View ${item.name}`}>
                    <img src={productImage(item)} alt={item.name} loading="lazy" />
                  </a>
                  <div className="pd-rel-body">
                    <span className="pd-rel-category">{item.category}</span>
                    <h3 className="pd-rel-name">
                      <a href={productLink(item)}>{item.name}</a>
                    </h3>
                    <div className="pd-rel-price-row">
                      <span className="pd-rel-price">{formatINR(item.price)}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
      <Toast toast={toast} />
    </section>
  )
}

export default ProductDetails
