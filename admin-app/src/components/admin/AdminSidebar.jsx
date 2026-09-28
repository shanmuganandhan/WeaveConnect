import { NavLink } from 'react-router-dom'
import { IconBarChart, IconUsers, IconFactory, IconTag, IconPackage, IconBell, IconGear, IconLogout } from '../ui/Icons'

const SIDEBAR_ITEMS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: <IconBarChart size={18} /> },
  { to: '/admin/seller-requests', label: 'Seller Requests', icon: <IconBell size={18} /> },
  { to: '/admin/users', label: 'Users', icon: <IconUsers size={18} /> },
  { to: '/admin/manufacturers', label: 'Manufacturers', icon: <IconFactory size={18} /> },
  { to: '/admin/products', label: 'Products', icon: <IconTag size={18} /> },
  { to: '/admin/orders', label: 'Orders', icon: <IconPackage size={18} /> },
  { to: '/admin/analytics', label: 'Analytics', icon: <IconBarChart size={18} /> },
  { to: '/admin/settings', label: 'Settings', icon: <IconGear size={18} /> },
]

function initials(name) {
  return (name || 'A')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

export default function AdminSidebar({ open, onClose, user, onLogout }) {
  return (
    <>
      <aside className={`admin-sidebar ${open ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <span className="admin-logo">◈</span>
          <span className="admin-logo-text">Admin Panel</span>
        </div>
        <nav className="admin-sidebar-nav">
          {SIDEBAR_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `admin-sidebar-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <span className="admin-sidebar-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-user">
            <div className="admin-avatar">{initials(user?.name)}</div>
            <div>
              <div className="admin-sidebar-name">{user?.name || 'Admin'}</div>
              <div className="admin-sidebar-email">{user?.email || 'admin@weaveconnect.com'}</div>
            </div>
          </div>
          <button type="button" className="admin-sidebar-logout" onClick={onLogout}>
            <IconLogout size={15} /> Logout
          </button>
        </div>
      </aside>
      {open && <div className="admin-overlay" onClick={onClose} />}
    </>
  )
}
