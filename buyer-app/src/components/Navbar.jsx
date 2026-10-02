import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth, homeRouteFor } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { IconBag, IconMenu, IconX, IconUser, IconPackage } from './ui/Icons'
import './Navbar.css'

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Collections', to: '/products' },
]

function Logo() {
  return (
    <>
      <svg className="navbar-logo-mark" width="34" height="34" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path d="M16 2L4 6v20l12 4 12-4V6L16 2z" stroke="currentColor" strokeWidth="1.8" />
        <path d="M16 6v20M8 10l8 2.5 8-2.5M8 16l8 2.5 8-2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      <span className="navbar-logo-text">
        Weave<span>Connect</span>
      </span>
    </>
  )
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const { itemCount } = useCart()
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Any navigation closes the mobile drawer, otherwise it stays open over the
  // page the shopper just clicked.
  useEffect(() => {
    setOpen(false)
  }, [location.pathname, location.search])

  const isBuyer = user?.role === 'buyer'
  const accountHref = user ? homeRouteFor(user.role) : '/login'

  const handleLogout = () => {
    logout()
    setOpen(false)
    navigate('/', { replace: true })
  }

  return (
    <header className={`navbar ${scrolled ? 'navbar-scrolled' : ''} ${open ? 'navbar-open' : ''}`}>
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" aria-label="WeaveConnect home">
          <Logo />
        </Link>

        <nav className="navbar-links" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}
          {isBuyer && (
            <>
              <NavLink
                to="/buyer/cart"
                className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
              >
                Cart
                {itemCount > 0 && (
                  <span className="navbar-link-count" aria-label={`${itemCount} item${itemCount === 1 ? '' : 's'} in cart`}>
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </NavLink>
              <NavLink
                to="/buyer/orders"
                className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
              >
                Orders
              </NavLink>
            </>
          )}
        </nav>

        <div className="navbar-actions">
          <NavLink
            to={isBuyer ? '/buyer/cart' : '/login'}
            className="navbar-cart"
            aria-label={isBuyer ? `Cart, ${itemCount} item${itemCount === 1 ? '' : 's'}` : 'Cart'}
          >
            <IconBag size={20} />
            {isBuyer && itemCount > 0 && (
              <span className="navbar-cart-count">{itemCount > 99 ? '99+' : itemCount}</span>
            )}
          </NavLink>

          {user ? (
            <div className="navbar-account">
              <Link to={accountHref} className="navbar-user" title={user.email}>
                <span className="navbar-user-avatar" aria-hidden="true">
                  {(user.name || 'U').charAt(0).toUpperCase()}
                </span>
                <span className="navbar-user-meta">
                  <strong>{(user.name || '').split(' ')[0] || 'Account'}</strong>
                  <small>{user.role === 'buyer' ? 'My Account' : user.role}</small>
                </span>
              </Link>
              <button type="button" className="navbar-logout" onClick={handleLogout}>
                Log out
              </button>
            </div>
          ) : (
            <div className="navbar-account">
              <Link to="/login" className="navbar-login">
                <IconUser size={18} />
                <span>Login</span>
              </Link>
              <Link to="/register" className="navbar-register">
                Create account
              </Link>
            </div>
          )}

          <button
            type="button"
            className="navbar-toggle"
            onClick={() => setOpen((prev) => !prev)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <IconX size={22} /> : <IconMenu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer - same links, stacked, so nothing is hidden on small screens. */}
      <div className="navbar-drawer" id="navbar-drawer">
        <Link to="/" className="navbar-drawer-link">Home</Link>
        <Link to="/products" className="navbar-drawer-link">Collections</Link>
        {isBuyer ? (
          <>
            <Link to="/buyer/cart" className="navbar-drawer-link">
              <IconBag size={18} /> Cart
              {itemCount > 0 && <span className="navbar-drawer-count">{itemCount}</span>}
            </Link>
            <Link to="/buyer/orders" className="navbar-drawer-link">
              <IconPackage size={18} /> Orders
            </Link>
            <Link to="/buyer/wishlist" className="navbar-drawer-link">Wishlist</Link>
            <Link to="/buyer/dashboard" className="navbar-drawer-link">My Account</Link>
            <button type="button" className="navbar-drawer-link navbar-drawer-btn" onClick={handleLogout}>
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="navbar-drawer-link">Login</Link>
            <Link to="/register" className="navbar-drawer-link">Create account</Link>
          </>
        )}
      </div>
    </header>
  )
}
