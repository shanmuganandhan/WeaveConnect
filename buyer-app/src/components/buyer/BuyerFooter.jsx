import { NavLink } from 'react-router-dom'

const LINKS = [
  { to: '/buyer/dashboard', label: 'Home' },
  { to: '/buyer/collection', label: 'Collection' },
  { to: '/buyer/wishlist', label: 'Wishlist' },
  { to: '/buyer/cart', label: 'Cart' },
  { to: '/buyer/orders', label: 'Orders' },
  { to: '/buyer/profile', label: 'Profile' },
]

export default function BuyerFooter() {
  return (
    <footer className="bd-footer">
      <div className="bd-footer-inner">
        <div className="bd-footer-brand">
          <span className="bd-logo-text">WeaveConnect</span>
          <p>Authentic handwoven silk, straight from India's master weaving families.</p>
        </div>
        <nav className="bd-footer-nav" aria-label="Buyer footer navigation">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className="bd-footer-link">
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <p className="bd-footer-copy">© {new Date().getFullYear()} WeaveConnect. All rights reserved.</p>
    </footer>
  )
}
