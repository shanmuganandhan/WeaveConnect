import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { getProduct, getProducts } from '../api/products'
import { formatINR } from '../utils/format'
import { productImage, manufacturerName } from '../utils/product'
import { formatDate } from '../utils/date'
import { useAuth } from '../context/AuthContext'
import { useWishlist } from '../context/WishlistContext'
import Toast from './ui/Toast'
import { useToast } from '../hooks/useToast'
import { useAddToCart } from '../hooks/useAddToCart'
import { SkeletonCard } from './ui/Skeleton'
import { ErrorState } from './ui/States'
import ProductImageCarousel from './ProductImageCarousel'
import ProductReviews from './ProductReviews'
import Stars from './ui/Stars'
import {
  IconBag,
  IconHeart,
  IconPackage,
  IconCoin,
  IconAlert,
  IconStore,
  IconArrowRight,
} from './ui/Icons'
import './ProductDetails.css'

// A single place for the stock message so the badge, the quantity cap and the
// button label cannot disagree with each other.
function stockState(product) {
  if (product.isAvailable === false) return { tone: 'out', label: 'Unavailable' }
  const stock = Number(product.stock) || 0
  if (stock === 0) return { tone: 'out', label: 'Out of stock' }
  if (stock <= 5) return { tone: 'low', label: `Only ${stock} left in stock` }
  return { tone: 'in', label: 'In stock' }
}

// The specifications tab can only show what the product record actually holds.
// Anything else (length, care, weave time) would be invented, so it is left out.
const SPEC_ROWS = (product) => [
  { label: 'Category', value: product.category || '—' },
  { label: 'Price', value: formatINR(product.price) },
  {
    label: 'Availability',
    value: product.isAvailable === false
      ? 'Not available'
      : Number(product.stock) > 0
        ? `${product.stock} in stock`
        : 'Out of stock',
  },
  { label: 'Units sold', value: Number(product.soldCount) || 0 },
  { label: 'Manufacturer', value: manufacturerName(product) },
  { label: 'Listed on', value: formatDate(product.createdAt) || '—' },
]

function ProductDetails() {
  const { id: productId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  // The product page renders outside /buyer, so it reads the wishlist from the
  // app-level WishlistProvider instead of BuyerProvider (which is not mounted
  // here and would throw).
  const { wishlist, toggleWishlist } = useWishlist()
  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [qty, setQty] = useState(1)
  const [activeTab, setActiveTab] = useState('description')
  const [busy, setBusy] = useState(false)
  const { toast, showToast } = useToast()
  const addToCart = useAddToCart(showToast)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    setProduct(null)
    setQty(1)
    try {
      const res = await getProduct(productId)
      const p = res?.data?.product
      if (!p) throw new Error('This saree could not be found.')
      setProduct(p)

      // Related sarees come from the same category. A failure here should not
      // take the whole page down, so it is handled separately.
      try {
        const rel = await getProducts({ category: p.category, limit: 100 })
        setRelated(
          (rel?.data?.products || []).filter((r) => r._id !== p._id).slice(0, 4)
        )
      } catch {
        setRelated([])
      }
    } catch (err) {
      setError(err?.message || 'We could not load this saree.')
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    load()
  }, [load])

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
          <ErrorState title="Could not load this saree" message={error} onRetry={load} />
          <div className="pd-notfound-actions">
            <Link to="/products" className="pd-btn-primary">Back to Collection</Link>
          </div>
        </div>
      </section>
    )
  }

  if (!product) {
    return (
      <section className="pd-page pd-notfound">
        <div className="pd-container">
          <div className="pd-notfound-box">
            <h1>Product not found</h1>
            <p>This saree is not listed anymore. Browse the collection for what is available.</p>
            <Link to="/products" className="pd-btn-primary">Back to Collection</Link>
          </div>
        </div>
      </section>
    )
  }

  const stock = stockState(product)
  const outOfStock = stock.tone === 'out'
  const mfgName = manufacturerName(product)
  const inWishlist = Array.isArray(wishlist) && wishlist.some((item) => item._id === product._id)
  const isBuyer = user?.role === 'buyer'
  const maxQty = Math.max(Number(product.stock) || 0, 1)
  const categoryLabel = product.category ? `${product.category} Silk` : 'Silk Saree'

  const changeQty = (delta) => {
    setQty((prev) => Math.min(Math.max(prev + delta, 1), maxQty))
  }

  const handleAddToCart = async () => {
    if (outOfStock) return
    setBusy(true)
    await addToCart(product, qty)
    setBusy(false)
  }

  const handleBuyNow = async () => {
    if (outOfStock) return
    setBusy(true)
    const ok = await addToCart(product, qty)
    setBusy(false)
    if (ok) navigate('/buyer/cart')
  }

  const handleWishlist = async () => {
    if (!isBuyer) {
      // Guests cannot save anything: send them to sign in and come back here.
      showToast('Please sign in to save sarees to your wishlist', 'error')
      const returnTo = encodeURIComponent(`/product/${productId}`)
      navigate(`/login?returnTo=${returnTo}`)
      return
    }
    try {
      const added = await toggleWishlist(product._id)
      showToast(added === false ? 'Removed from wishlist' : 'Saved to wishlist')
    } catch (err) {
      showToast(err?.message || 'Could not update your wishlist', 'error')
    }
  }

  return (
    <section className="pd-page" aria-labelledby="pd-title">
      <div className="pd-container">
        <nav className="pd-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span className="pd-breadcrumb-sep">/</span>
          <Link to="/products">Collection</Link>
          {product.category && (
            <>
              <span className="pd-breadcrumb-sep">/</span>
              <Link to={`/products?category=${encodeURIComponent(product.category)}`} className="pd-breadcrumb-cat">
                {categoryLabel}
              </Link>
            </>
          )}
          <span className="pd-breadcrumb-sep">/</span>
          <span className="pd-breadcrumb-current">{product.name}</span>
        </nav>

        <div className="pd-layout">
          <div className="pd-gallery">
            <ProductImageCarousel
              key={product._id}
              product={product}
              className="pd-main-image"
              overlay={stock.tone === 'low' ? <span className="pd-badge">{stock.label}</span> : null}
            />
          </div>

          <div className="pd-info">
            <span className="pd-category">{categoryLabel}</span>
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

            <p className="pd-description">
              {product.description ||
                'The manufacturer has not added a description for this saree yet.'}
            </p>

            <div className="pd-qty-row">
              <div className="pd-qty-block">
                <span className="pd-label">Quantity</span>
                <div className="pd-qty">
                  <button type="button" onClick={() => changeQty(-1)} disabled={outOfStock || qty <= 1} aria-label="Decrease quantity">
                    &minus;
                  </button>
                  <span className="pd-qty-value">{qty}</span>
                  <button
                    type="button"
                    onClick={() => changeQty(1)}
                    disabled={outOfStock || qty >= maxQty}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>
              <span className={`pd-stock pd-stock-${stock.tone}`}>
                <span className="pd-stock-dot"></span> {stock.label}
              </span>
            </div>

            <div className="pd-actions">
              <button
                type="button"
                className="pd-btn-cart"
                onClick={handleAddToCart}
                disabled={outOfStock || busy}
              >
                <IconBag size={18} />
                {outOfStock ? 'Out of stock' : busy ? 'Adding…' : 'Add to Cart'}
              </button>
              <button
                type="button"
                className="pd-btn-buy"
                onClick={handleBuyNow}
                disabled={outOfStock || busy}
              >
                Buy Now
                <IconArrowRight size={17} />
              </button>
              {isBuyer && (
                <button
                  type="button"
                  className={`pd-btn-wish${inWishlist ? ' active' : ''}`}
                  onClick={handleWishlist}
                  aria-pressed={inWishlist}
                  title={inWishlist ? 'Remove from wishlist' : 'Save to wishlist'}
                >
                  <IconHeart size={18} />
                  <span>{inWishlist ? 'Saved' : 'Wishlist'}</span>
                </button>
              )}
            </div>

            {/* Facts taken straight from how the store works - no shipping,
                certificate or returns promises that the backend cannot keep. */}
            <ul className="pd-trust">
              <li>
                <IconPackage size={18} />
                Your order goes directly to {mfgName}
              </li>
              <li>
                <IconCoin size={18} />
                Payment is cash on delivery
              </li>
              <li>
                <IconAlert size={18} />
                Stock is re-checked when the order is placed
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
                  {product.description ||
                    'The manufacturer has not added a description for this saree yet. Check the specifications tab for the details that are on record.'}
                </p>
                <div className="pd-note">
                  <IconAlert size={20} />
                  Colour and motif can look slightly different from one handwoven piece to
                  the next, and screen colours are not exact.
                </div>
              </div>
            )}

            {activeTab === 'specs' && (
              <div className="pd-panel-inner">
                <h2>Specifications</h2>
                <div className="pd-specs">
                  {SPEC_ROWS(product).map((row) => (
                    <div className="pd-spec" key={row.label}>
                      <span className="pd-spec-label">{row.label}</span>
                      <span className="pd-spec-value">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'manufacturer' && (
              <div className="pd-panel-inner">
                <h2>Manufacturer</h2>
                <div className="pd-manufacturer">
                  <div className="pd-mfg-avatar" aria-hidden="true">
                    <IconStore size={30} />
                  </div>
                  <div className="pd-mfg-details">
                    <div className="pd-mfg-name-row">
                      <h3>{mfgName}</h3>
                    </div>
                    <p className="pd-mfg-desc">
                      {mfgName} is the seller who listed this saree. The order and the
                      payment go to them, and their store shows everything they have
                      listed right now.
                    </p>
                    <div className="pd-mfg-stats">
                      <span>
                        <strong>{Number(product.stock) || 0}</strong> in stock
                      </span>
                      <span>
                        <strong>{Number(product.soldCount) || 0}</strong> sold
                      </span>
                      <span>
                        <strong>{categoryLabel}</strong> category
                      </span>
                    </div>
                    {product.manufacturer?._id && (
                      <Link to={`/store/${product.manufacturer._id}`} className="pd-store-link">
                        Visit {mfgName}'s store
                        <IconArrowRight size={16} />
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
              <span className="pd-related-badge">More from {product.category || 'the collection'}</span>
              <h2>Related Sarees</h2>
            </div>
            <div className="pd-related-grid">
              {related.map((item) => (
                <article key={item._id} className="pd-rel-card">
                  <Link to={`/product/${item._id}`} className="pd-rel-image" aria-label={`View ${item.name}`}>
                    <img src={productImage(item)} alt={item.name} loading="lazy" />
                  </Link>
                  <div className="pd-rel-body">
                    <span className="pd-rel-category">{item.category}</span>
                    <h3 className="pd-rel-name">
                      <Link to={`/product/${item._id}`}>{item.name}</Link>
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
