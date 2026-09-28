import { Link } from 'react-router-dom'
import { useBuyer } from '../../context/BuyerContext'
import { useAuth } from '../../context/AuthContext'
import { formatINR } from '../../utils/format'
import { formatDate, orderId } from '../../utils/date'
import { productImage, productLink } from '../../utils/product'
import { IconUser, IconPackage, IconHeart, IconTruck } from '../../components/ui/Icons'

export default function BuyerDashboard() {
  const { user } = useAuth()
  const { orders, wishlist } = useBuyer()

  const active = orders.filter((o) => o.status !== 'cancelled')
  const recent = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3)
  const purchased = orders.filter((o) => o.status === 'delivered').flatMap((o) => o.items || [])

  return (
    <div className="bd-dashboard">
      <section className="bd-welcome">
        <div className="bd-welcome-text">
          <h1>Namaste, {user?.name?.split(' ')[0] || 'Guest'}.</h1>
          <p>Explore handwoven artistry — each saree tells a story of <strong>tradition & craft</strong>.</p>
        </div>
        <div className="bd-welcome-stats">
          <div className="bd-ws-item">
            <strong>{orders.length}</strong>
            <span>Orders</span>
          </div>
          <div className="bd-ws-divider" aria-hidden="true" />
          <div className="bd-ws-item">
            <strong>{wishlist.length}</strong>
            <span>Wishlist</span>
          </div>
          <div className="bd-ws-divider" aria-hidden="true" />
          <div className="bd-ws-item">
            <strong>{active.length}</strong>
            <span>In Progress</span>
          </div>
        </div>
      </section>

      <div className="bd-grid">
        <div className="bd-main">
          <section className="bd-card bd-orders-card">
            <div className="bd-card-header">
              <h2>Recent Orders</h2>
              <Link to="/buyer/orders" className="bd-link">View all</Link>
            </div>
            {recent.length === 0 ? (
              <p className="bd-empty-wishlist">No orders yet — your first woven treasure is waiting.</p>
            ) : (
              <div className="bd-orders-list">
                {recent.map((order) => (
                  <div key={order._id} className="bd-order-row">
                    <img className="bd-order-img" src={productImage(order.items?.[0]?.product)} alt="" />
                    <div className="bd-order-info">
                      <h3>{order.items?.[0]?.product?.name || 'Order items'}</h3>
                      <span className="bd-order-id">
                        #{orderId(order._id)} · {formatDate(order.createdAt)}
                      </span>
                    </div>
                    <div className="bd-order-right">
                      <span className="bd-order-price">{formatINR(order.totalAmount)}</span>
                      <span className={`bd-status bd-status-${order.status === 'pending' || order.status === 'accepted' ? 'processing' : order.status}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bd-card bd-purchases-card">
            <div className="bd-card-header">
              <h2>Your Purchases</h2>
              <span className="bd-card-count">{purchased.length} items</span>
            </div>
            {purchased.length === 0 ? (
              <p className="bd-empty-wishlist">Delivered sarees will appear here.</p>
            ) : (
              <div className="bd-purchases-scroll">
                {purchased.map((item, i) => (
                  <Link key={i} to={productLink(item.product?._id)} className="bd-purchase-chip">
                    <img src={productImage(item.product)} alt="" />
                    <div className="bd-purchase-info">
                      <h4>{item.product?.name || 'Product'}</h4>
                      <span>{formatINR(item.price)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="bd-sidebar">
          <section className="bd-card bd-wishlist-card">
            <div className="bd-card-header">
              <h2>Wishlist</h2>
              <Link to="/buyer/wishlist" className="bd-link">View all</Link>
            </div>
            {wishlist.length === 0 ? (
              <p className="bd-empty-wishlist">Nothing saved yet.</p>
            ) : (
              <div className="bd-wishlist-list">
                {wishlist.slice(0, 3).map((item) => (
                  <div key={item._id} className="bd-wish-item">
                    <Link to={productLink(item._id)} className="bd-wish-img">
                      <img src={productImage(item)} alt="" />
                    </Link>
                    <div className="bd-wish-info">
                      <h3><Link to={productLink(item._id)}>{item.name}</Link></h3>
                      <div className="bd-wish-price-row">
                        <span>{formatINR(item.price)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bd-card bd-account-card">
            <h2>Your Account</h2>
            <div className="bd-account-grid">
              <div className="bd-acct-item">
                <IconUser size={20} />
                <div>
                  <strong>{user?.name?.split(' ')[0] || '—'}</strong>
                  <span>{user?.email}</span>
                </div>
              </div>
              <div className="bd-acct-item">
                <IconPackage size={20} />
                <div>
                  <strong>{orders.length}</strong>
                  <span>Total Orders</span>
                </div>
              </div>
              <div className="bd-acct-item">
                <IconHeart size={20} />
                <div>
                  <strong>{wishlist.length}</strong>
                  <span>Wishlist</span>
                </div>
              </div>
              <div className="bd-acct-item">
                <IconTruck size={20} />
                <div>
                  <strong>{orders.filter((o) => o.status === 'delivered').length}</strong>
                  <span>Delivered</span>
                </div>
              </div>
            </div>
            <Link to="/buyer/profile" className="bd-link">Manage profile →</Link>
          </section>
        </div>
      </div>
    </div>
  )
}
