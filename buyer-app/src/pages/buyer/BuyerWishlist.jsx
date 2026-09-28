import { Link } from 'react-router-dom'
import { useBuyer } from '../../context/BuyerContext'
import { formatINR } from '../../utils/format'
import { productImage, productLink } from '../../utils/product'
import { IconHeart, IconX } from '../../components/ui/Icons'
import { EmptyState } from '../../components/ui/States'

export default function BuyerWishlist() {
  const { wishlist, removeWishlistItem } = useBuyer()

  if (wishlist.length === 0) {
    return (
      <EmptyState
        icon={<IconHeart size={32} />}
        title="Your wishlist is empty"
        message="Save sarees you love and find them here later."
        action={{ label: 'Browse Collection', to: '/products' }}
      />
    )
  }

  return (
    <section className="bd-card">
      <div className="bd-card-header">
        <h2>My Wishlist</h2>
        <span className="bd-card-count">{wishlist.length} saved</span>
      </div>
      <div className="bd-wishlist-list">
        {wishlist.map((item) => (
          <div key={item._id} className="bd-wish-item">
            <Link to={productLink(item._id)} className="bd-wish-img">
              <img src={productImage(item)} alt="" />
            </Link>
            <div className="bd-wish-info">
              <h3><Link to={productLink(item._id)}>{item.name}</Link></h3>
              <div className="bd-wish-price-row">
                <span>{formatINR(item.price)}</span>
                {item.stock > 0 && item.stock <= 5 && <span className="bd-wish-discount">Only {item.stock} left</span>}
              </div>
            </div>
            <button
              type="button"
              className="bd-wish-remove"
              title="Remove from wishlist"
              onClick={() => removeWishlistItem(item._id)}
            >
              <IconX size={16} />
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
