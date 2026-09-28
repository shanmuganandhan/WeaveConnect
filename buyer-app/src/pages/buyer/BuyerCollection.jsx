import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import * as buyerApi from '../../api/buyerApi'
import { formatINR } from '../../utils/format'
import { productImage, productImageCount, productLink } from '../../utils/product'
import { IconSearch } from '../../components/ui/Icons'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/States'
import { PhotoCountBadge } from '../../components/ui/PhotoCountBadge'

const CATEGORIES = ['All', 'Kanchipuram', 'Banarasi', 'Mysore', 'Patola', 'Pochampally', 'Paithani']
const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
]

export default function BuyerCollection() {
  const [params, setParams] = useSearchParams()
  const category = params.get('category') || 'All'
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('newest')
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    buyerApi
      .getStoreProducts({ limit: 60, search, category: category === 'All' ? '' : category })
      .then((res) => { if (alive) setProducts(res.data.products || []) })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [search, category])

  const setCategory = (value) => {
    const next = new URLSearchParams(params)
    if (value === 'All') next.delete('category')
    else next.set('category', value)
    setParams(next, { replace: true })
  }

  const sorted = [...products].sort((a, b) => {
    if (sort === 'price-asc') return a.price - b.price
    if (sort === 'price-desc') return b.price - a.price
    return new Date(b.createdAt) - new Date(a.createdAt)
  })

  return (
    <div className="bd-collection">
      <section className="bd-card bd-collection-toolbar">
        <div className="bd-collection-search">
          <IconSearch size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sarees…"
          />
        </div>
        <div className="bd-chips" role="group" aria-label="Category">
          {CATEGORIES.map((c) => (
            <button key={c} type="button" className={category === c ? 'active' : ''} onClick={() => setCategory(c)}>
              {c}
            </button>
          ))}
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="bd-sort-select">
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </section>

      <section>
        <div className="bd-card-header">
          <h2>{category === 'All' ? 'All Sarees' : category}</h2>
          <span className="bd-card-count">{sorted.length} items</span>
        </div>
        {loading ? (
          <div className="bd-rec-grid">
            <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
          </div>
        ) : sorted.length === 0 ? (
          <EmptyState title="No sarees match your search" message="Try a different category or keyword." />
        ) : (
          <div className="bd-rec-grid">
            {sorted.map((p) => (
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
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
