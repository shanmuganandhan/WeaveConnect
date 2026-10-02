import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as buyerApi from '../../api/buyerApi'
import { formatINR } from '../../utils/format'
import { productImage, productImageCount, productLink } from '../../utils/product'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { PhotoCountBadge } from '../../components/ui/PhotoCountBadge'
import { useToast } from '../../hooks/useToast'
import { useAddToCart } from '../../hooks/useAddToCart'

const CATEGORIES = ['Kanchipuram', 'Banarasi', 'Mysore', 'Patola', 'Pochampally', 'Paithani']

export default function BuyerHome() {
  const [featured, setFeatured] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const { showToast } = useToast()
  const addToCart = useAddToCart(showToast)

  const handleAddToCart = async (product) => {
    setBusyId(product._id)
    await addToCart(product, 1)
    setBusyId(null)
  }

  useEffect(() => {
    let alive = true
    buyerApi
      .getStoreProducts({ limit: 8 })
      .then((res) => { if (alive) setFeatured(res.data.products || []) })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  return (
    <div className="bd-home">
      <section className="bd-welcome">
        <div className="bd-welcome-text">
          <h1>Discover Handwoven Sarees</h1>
          <p>Authentic looms, timeless weaves — now with a <strong>seamless checkout</strong> experience.</p>
        </div>
        <Link to="/products" className="bd-link">Browse full collection →</Link>
      </section>

      <section>
        <div className="bd-card-header">
          <h2>Shop by Category</h2>
        </div>
        <div className="bd-rec-grid">
          {CATEGORIES.map((c) => (
            <Link key={c} to={`/products?category=${c}`} className="bd-cat-card">
              <strong>{c}</strong>
              <span>Explore →</span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="bd-card-header">
          <h2>Featured Sarees</h2>
          <Link to="/products" className="bd-link">View all</Link>
        </div>
        {loading ? (
          <div className="bd-rec-grid">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <div className="bd-rec-grid">
            {featured.map((p) => (
              <article key={p._id} className="bd-rec-card">
                <Link to={productLink(p._id)} className="bd-rec-image">
                  <img src={productImage(p)} alt={p.name} loading="lazy" />
                  {p.stock > 0 && p.stock <= 5 && <span className="bd-rec-badge">Low Stock</span>}
                  <PhotoCountBadge count={productImageCount(p)} className="bd-photo-count" />
                </Link>
                <div className="bd-rec-body">
                  <span className="bd-rec-cat">{p.category}</span>
                  <h3 className="bd-rec-name"><Link to={productLink(p._id)}>{p.name}</Link></h3>
                  <div className="bd-rec-price-row">
                    <span className="bd-rec-price">{formatINR(p.price)}</span>
                  </div>
                  <button
                    type="button"
                    className="bd-rec-add"
                    onClick={() => handleAddToCart(p)}
                    disabled={(p.stock ?? 0) < 1 || busyId === p._id}
                  >
                    {busyId === p._id ? 'Adding…' : (p.stock ?? 0) < 1 ? 'Sold Out' : 'Add to Cart'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
