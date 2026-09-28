import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './FeaturedSarees.css'
import Toast from './ui/Toast'
import { useToast } from '../hooks/useToast'
import { getProducts } from '../api/products'
import { productImage, productImageCount, productLink } from '../utils/product'
import { formatINR } from '../utils/format'
import { useAddToCart } from '../hooks/useAddToCart'
import { PhotoCountBadge } from './ui/PhotoCountBadge'

function FeaturedSarees() {
  const [sarees, setSarees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [wishlisted, setWishlisted] = useState(new Set())
  const [added, setAdded] = useState(new Set())
  const { toast, showToast } = useToast()
  const addToCart = useAddToCart(showToast)
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    getProducts({ limit: 6 })
      .then((res) => {
        if (active) setSarees(res.data.products || [])
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
  }, [])

  const toggleWishlist = (saree) => {
    setWishlisted((prev) => {
      const next = new Set(prev)
      if (next.has(saree._id)) {
        next.delete(saree._id)
        showToast(`${saree.name} removed from wishlist`, 'error')
      } else {
        next.add(saree._id)
        showToast(`${saree.name} added to wishlist`)
      }
      return next
    })
  }

  const handleAddToCart = async (saree) => {
    const ok = await addToCart(saree)
    if (ok) setAdded((prev) => new Set(prev).add(saree._id))
  }

  const goToProduct = (saree) => {
    navigate(productLink(saree))
  }

  return (
    <section id="featured" className="featured-sarees" aria-labelledby="featured-title">
      <div className="container">
        <div className="section-header">
          <span className="section-badge">Featured Collection</span>
          <h2 id="featured-title" className="section-title">
            Handpicked <span className="section-highlight">Silk Sarees</span>
          </h2>
          <p className="section-description">
            Curated from India's most celebrated weaving regions, each saree represents 
            generations of artisanal mastery and timeless beauty.
          </p>
        </div>
        
        <div className="sarees-grid" role="list">
          {loading
            ? Array.from({ length: 6 }, (_, i) => (
                <article key={i} className="saree-card" style={{ '--index': i }} aria-hidden="true">
                  <div className="saree-image-wrapper">
                    <div className="skeleton" style={{ width: '100%', height: '100%' }}></div>
                  </div>
                </article>
              ))
            : error
              ? null
              : sarees.map((saree, index) => {
                  const isWishlisted = wishlisted.has(saree._id)
                  const isAdded = added.has(saree._id)
                  const available = saree.stock > 0
                  return (
                    <article key={saree._id} className="saree-card" role="listitem" style={{ '--index': index }}>
                      <div className="saree-image-wrapper">
                        <img 
                          src={productImage(saree)} 
                          alt={`${saree.name} - ${saree.description || 'handwoven silk saree'}`}
                          className="saree-image"
                          loading="lazy"
                        />
                        {!available && <div className="saree-badge">Sold Out</div>}
                        <PhotoCountBadge count={productImageCount(saree)} className="saree-photo-count" />
                        <div className="saree-overlay">
                          <div className="overlay-content">
                            <button className="overlay-btn" aria-label={`Quick view ${saree.name}`} onClick={() => goToProduct(saree)}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                              </svg>
                              <span>Quick View</span>
                            </button>
                            <button
                              className={`overlay-btn overlay-btn-secondary ${isWishlisted ? 'wishlisted' : ''}`}
                              aria-label={isWishlisted ? `Remove ${saree.name} from wishlist` : `Add ${saree.name} to wishlist`}
                              aria-pressed={isWishlisted}
                              onClick={() => toggleWishlist(saree)}
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="saree-content">
                        <div className="saree-meta">
                          <span className="saree-region">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                              <circle cx="12" cy="10" r="3"/>
                            </svg>
                            {saree.category}
                          </span>
                        </div>
                        <h3 className="saree-name">{saree.name}</h3>
                        <p className="saree-description">{saree.description || 'Handwoven pure silk saree.'}</p>
                        <div className="saree-pricing">
                          <span className="saree-price">{formatINR(saree.price)}</span>
                        </div>
                        {isAdded ? (
                          <Link to="/buyer/cart" className="btn btn-primary saree-add-btn">
                            Go to Cart
                          </Link>
                        ) : (
                          <button
                            className="btn btn-outline saree-add-btn"
                            onClick={() => handleAddToCart(saree)}
                            disabled={!available}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                              <line x1="3" y1="6" x2="21" y2="6"/>
                              <path d="M16 10a4 4 0 0 1 4 4v4"/>
                            </svg>
                            {available ? 'Add to Cart' : 'Sold Out'}
                          </button>
                        )}
                      </div>
                    </article>
                  )
                })}
        </div>
        
        <div className="section-cta">
          <Link to="/products" className="btn btn-primary">
            <span>View All Sarees</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </div>
      </div>
      <Toast toast={toast} />
    </section>
  )
}

export default FeaturedSarees
