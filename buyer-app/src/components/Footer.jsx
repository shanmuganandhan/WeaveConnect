import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Footer.css'

const QUICK_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/products', label: 'Collections' },
  { to: '/products?category=Kanchipuram', label: 'Kanchipuram silk' },
  { to: '/products?category=Banarasi', label: 'Banarasi silk' },
  { to: '/products?category=Patola', label: 'Patola silk' },
]

const ACCOUNT_LINKS = [
  { to: '/buyer/cart', label: 'Cart' },
  { to: '/buyer/orders', label: 'Orders' },
  { to: '/buyer/wishlist', label: 'Wishlist' },
  { to: '/buyer/dashboard', label: 'Account' },
]

export default function Footer() {
  const { user } = useAuth()
  const isBuyer = user?.role === 'buyer'
  const year = new Date().getFullYear()

  // Buyers get the shopping links, guests get sign-in links instead.
  const shoppingLinks = isBuyer ? ACCOUNT_LINKS : [
    { to: '/login', label: 'Login' },
    { to: '/register', label: 'Register' },
  ]

  return (
    <footer id="footer" className="footer" role="contentinfo">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-logo">
              <svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <path d="M16 2L4 6v20l12 4 12-4V6L16 2z" stroke="currentColor" strokeWidth="1.8" />
                <path d="M16 6v20M8 10l8 2.5 8-2.5M8 16l8 2.5 8-2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <span className="footer-logo-text">
                Weave<span>Connect</span>
              </span>
            </div>
            <p className="footer-text">
              A marketplace where buyers order traditional silk sarees directly from
              the manufacturers who weave them.
            </p>
          </div>

          <nav className="footer-nav" aria-label="Quick links">
            <h4 className="footer-heading">Quick links</h4>
            <ul className="footer-links">
              {QUICK_LINKS.map((link) => (
                <li key={link.label}>
                  <Link to={link.to}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="footer-nav" aria-label="Products">
            <h4 className="footer-heading">Products</h4>
            <ul className="footer-links">
              <li><Link to="/products">All sarees</Link></li>
              <li><Link to="/products?category=Pochampally">Pochampally ikat</Link></li>
              <li><Link to="/products?category=Mysore">Mysore silk</Link></li>
              <li><Link to="/products?category=Paithani">Paithani silk</Link></li>
              <li><Link to="/products">Search the catalog</Link></li>
            </ul>
          </nav>

          <nav className="footer-nav" aria-label="Orders and cart">
            <h4 className="footer-heading">Orders</h4>
            <ul className="footer-links">
              {shoppingLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.to}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="footer-nav">
            <h4 className="footer-heading">Contact</h4>
            <ul className="footer-links footer-contact">
              <li>Email: <span className="footer-placeholder">support@weaveconnect.example</span></li>
              <li>Phone: <span className="footer-placeholder">+91 00000 00000</span></li>
              <li>Support: <span className="footer-placeholder">Monday – Saturday, 10am – 6pm</span></li>
            </ul>
            <p className="footer-note">Contact details are placeholders for this project.</p>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copy">© {year} WeaveConnect. All rights reserved.</p>
          <p className="footer-copy-note">University mini-project · frontend for an existing backend API</p>
        </div>
      </div>
    </footer>
  )
}
