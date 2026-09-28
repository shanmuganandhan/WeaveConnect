import { NavLink } from 'react-router-dom'
import {
  IconBarChart,
  IconPackage,
  IconPlus,
  IconTruck,
  IconUser,
  IconLogout,
  IconStore,
  IconCoin,
} from '../ui/Icons'

const NAV = [
  { to: '/seller/dashboard', label: 'Dashboard', icon: <IconBarChart size={20} /> },
  { to: '/seller/products', label: 'Products', icon: <IconPackage size={20} /> },
  { to: '/seller/products/add', label: 'Add Product', icon: <IconPlus size={20} /> },
  { to: '/seller/orders', label: 'Orders', icon: <IconTruck size={20} /> },
  { to: '/seller/analytics', label: 'Analytics', icon: <IconCoin size={20} /> },
  { to: '/seller/profile', label: 'Profile', icon: <IconUser size={20} /> },
]

export default function ManufacturerSidebar({ open, onClose, onLogout }) {
  return (
    <>
      <div className={`md-sidebar-overlay ${open ? 'open' : ''}`} onClick={onClose} />
      <aside className={`md-sidebar ${open ? 'open' : ''}`}>
        <div className="md-sidebar-logo">
          <svg aria-hidden="true" width="34" height="34" viewBox="0 0 32 32" fill="none">
            <path d="M16 2L4 6v20l12 4 12-4V6L16 2z" stroke="#d4af37" strokeWidth="2" />
            <path d="M16 6v20M8 10l8 2.5 8-2.5M8 16l8 2.5 8-2.5" stroke="#d4af37" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span>WeaveConnect <small>Seller Hub</small></span>
        </div>

        <nav className="md-sidebar-nav" aria-label="Dashboard navigation">
          <p className="md-sidebar-section">Menu</p>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `md-nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <span className="md-nav-icon">{item.icon}</span>
              {item.label}
          </NavLink>
          ))}
        </nav>

        <div className="md-sidebar-bottom">
          <a href={`${import.meta.env.VITE_BUYER_APP_URL || 'http://localhost:3000'}/products`} className="md-nav-item md-nav-link" target="_blank" rel="noopener noreferrer">
            <span className="md-nav-icon"><IconStore size={18} /></span>
            View Storefront
          </a>
          <button type="button" className="md-nav-item md-nav-link" onClick={onLogout}>
            <span className="md-nav-icon"><IconLogout size={20} /></span>
            Logout
          </button>
          <div className="md-sidebar-card">
            <span className="md-sidebar-card-title">Need help?</span>
            <p>Our seller support team is available 24/7.</p>
            <a href="mailto:seller@weaveconnect.com">seller@weaveconnect.com</a>
          </div>
        </div>
      </aside>
    </>
  )
}
