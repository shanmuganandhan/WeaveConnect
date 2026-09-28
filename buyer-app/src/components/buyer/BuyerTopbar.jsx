import { NavLink } from 'react-router-dom'

function initials(name) {
  return (name || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

export default function BuyerTopbar({ userName, onLogout }) {
  return (
    <header className="bd-topbar">
      <NavLink to="/buyer/collection" className="bd-logo">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path d="M16 2L4 6v20l12 4 12-4V6L16 2z" stroke="#d4af37" strokeWidth="2" />
          <path d="M16 6v20M8 10l8 2.5 8-2.5M8 16l8 2.5 8-2.5" stroke="#d4af37" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span className="bd-logo-text">WeaveConnect</span>
      </NavLink>
      <div className="bd-topbar-right">
        <NavLink to="/products" className="bd-topbar-link">Browse Collection</NavLink>
        <NavLink to="/buyer/orders" className="bd-topbar-link">Orders</NavLink>
        <NavLink to="/buyer/wishlist" className="bd-topbar-link">Wishlist</NavLink>
        <NavLink to="/buyer/cart" className="bd-topbar-link">Cart</NavLink>
        <button type="button" className="bd-topbar-link bd-topbar-btn" onClick={onLogout}>Sign Out</button>
        <div className="bd-topbar-avatar" aria-hidden="true">{initials(userName)}</div>
      </div>
    </header>
  )
}
