import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Collection', to: '/products' },
  { label: 'About', href: '#story' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Contact', href: '#footer' },
]

function DashboardLabel({ user }) {
  if (user.role === 'admin') return { label: 'Admin Panel', to: '/admin/dashboard' }
  if (user.role === 'manufacturer') return { label: 'Seller Hub', to: '/manufacturer/dashboard' }
  return { label: 'My Account', to: '/buyer/dashboard' }
}

function Navbar() {
  const { user, logout } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const dashboard = user ? DashboardLabel({ user }) : null

  const handleLogout = () => {
    logout()
    setMenuOpen(false)
    navigate('/')
  }

  return (
    <header className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" onClick={() => setMenuOpen(false)} aria-label="WeaveConnect home">
          <svg width="34" height="34" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <path d="M16 2L4 6v20l12 4 12-4V6L16 2z" stroke="#d4af37" strokeWidth="2" />
            <path d="M16 6v20M8 10l8 2.5 8-2.5M8 16l8 2.5 8-2.5" stroke="#d4af37" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="navbar-logo-text">WeaveConnect</span>
        </Link>

        <nav className={`navbar-menu ${menuOpen ? 'open' : ''}`} aria-label="Main navigation">
          <ul className="navbar-links">
            {navLinks.map((link) => (
              <li key={link.label}>
                {link.to ? (
                  <Link
                    to={link.to}
                    onClick={() => setMenuOpen(false)}
                    className={location.pathname === link.to ? 'active' : ''}
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a href={link.href} onClick={() => setMenuOpen(false)}>
                    {link.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
          <div className="navbar-actions">
            {user ? (
              <>
                <Link to={dashboard.to} className="btn-login" onClick={() => setMenuOpen(false)}>
                  {dashboard.label}
                </Link>
                <button type="button" className="btn-register" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/seller/register" className="btn-seller" onClick={() => setMenuOpen(false)}>
                  Become a Seller
                </Link>
                <Link to="/login" className="btn-login" onClick={() => setMenuOpen(false)}>
                  Sign In
                </Link>
                <Link to="/register" className="btn-register" onClick={() => setMenuOpen(false)}>
                  Register
                </Link>
              </>
            )}
          </div>
        </nav>

        <button
          type="button"
          className={`navbar-toggle ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </header>
  )
}

export default Navbar