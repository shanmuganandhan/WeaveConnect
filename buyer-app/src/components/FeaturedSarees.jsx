import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getProducts } from '../api/products'
import { formatINR } from '../utils/format'
import { availabilityLabel, productImage, productLink } from '../utils/product'
import { useAddToCart } from '../hooks/useAddToCart'
import { useToast } from '../hooks/useToast'
import Toast from './ui/Toast'
import { SkeletonGrid } from './ui/Skeleton'
import { EmptyState, ErrorState } from './ui/States'
import { IconEye, IconBag, IconArrowRight } from './ui/Icons'
import './FeaturedSarees.css'

const FEATURED_COUNT = 8

function FeaturedSarees() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [addedIds, setAddedIds] = useState([])
  const { toast, showToast } = useToast()
  const addToCart = useAddToCart(showToast)

  const loadProducts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await getProducts({ limit: FEATURED_COUNT })
      setProducts(response?.data?.products || [])
    } catch (err) {
      setError(err?.message || 'We could not load the featured sarees.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  const handleAdd = async (product) => {
    setBusyId(product._id)
    const ok = await addToCart(product, 1)
    if (ok) setAddedIds((prev) => (prev.includes(product._id) ? prev : [...prev, product._id]))
    setBusyId(null)
  }

  return (
    <section id="featured" className="featured-sarees" aria-labelledby="featured-title">
      <div className="container">
        <div className="section-header">
          <span className="section-badge">Featured sarees</span>
          <h2 id="featured-title" className="section-title">
            Handpicked from the <span className="section-highlight">storefront</span>
          </h2>
          <p className="section-description">
            Newly listed sarees from our registered manufacturers. Prices and stock
            come straight from the product records.
          </p>
        </div>

        {loading ? (
          <SkeletonGrid count={8} footer />
        ) : error ? (
          <ErrorState title="Could not load featured sarees" message={error} onRetry={loadProducts} />
        ) : products.length === 0 ? (
          <EmptyState
            title="No sarees listed yet"
            message="Manufacturers have not added products to the store yet. Please check back soon."
            action={{ label: 'Open the collection', to: '/products' }}
          />
        ) : (
          <div className="sarees-grid" role="list">
            {products.map((product) => {
              const stock = Number(product.stock) || 0
              const available = product.isAvailable !== false && stock > 0
              const availability = availabilityLabel(product)
              const added = addedIds.includes(product._id)

              return (
                <article key={product._id} className="saree-card" role="listitem">
                  <Link to={productLink(product)} className="saree-image-link" tabIndex={-1} aria-hidden="true">
                    <img
                      src={productImage(product)}
                      alt={product.name}
                      className="saree-image"
                      loading="lazy"
                    />
                  </Link>

                  {!available && <span className="saree-tag saree-tag-out">Out of stock</span>}
                  {available && stock <= 5 && <span className="saree-tag">Only {stock} left</span>}

                  <div className="saree-body">
                    <span className="saree-category">{product.category}</span>
                    <h3 className="saree-name">
                      <Link to={productLink(product)}>{product.name}</Link>
                    </h3>

                    <div className="saree-meta">
                      <span className="saree-price">{formatINR(product.price)}</span>
                      <span className={`saree-stock saree-stock-${availability.tone}`}>
                        {availability.label}
                      </span>
                    </div>

                    <div className="saree-actions">
                      <button
                        type="button"
                        className="saree-btn saree-btn-primary"
                        onClick={() => handleAdd(product)}
                        disabled={!available || busyId === product._id}
                      >
                        <IconBag size={17} />
                        {busyId === product._id ? 'Adding…' : added ? 'Add another' : 'Add to Cart'}
                      </button>
                      <Link to={productLink(product)} className="saree-btn saree-btn-ghost">
                        <IconEye size={17} />
                        View Details
                      </Link>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        <div className="section-cta">
          <Link to="/products" className="featured-cta">
            Browse the full collection
            <IconArrowRight size={18} />
          </Link>
        </div>
      </div>
      <Toast toast={toast} />
    </section>
  )
}

export default FeaturedSarees
