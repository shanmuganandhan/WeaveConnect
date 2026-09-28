import { IconBell, IconMenu } from '../ui/Icons'

const PAGE_META = {
  '/seller/dashboard': { title: 'Dashboard', subtitle: 'Your business at a glance.' },
  '/seller/products': { title: 'Products', subtitle: 'Manage your saree catalogue, stock and status.' },
  '/seller/products/add': { title: 'Add Product', subtitle: 'List a new handwoven saree to your store.' },
  '/seller/orders': { title: 'Orders', subtitle: 'Track and manage incoming customer orders.' },
  '/seller/analytics': { title: 'Analytics', subtitle: 'Revenue trends and product performance.' },
  '/seller/profile': { title: 'Profile', subtitle: 'Your business information and contact details.' },
}

function initials(name) {
  return (name || 'M')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

export default function ManufacturerTopbar({ pathname, userName, onOpenMenu }) {
  const meta = PAGE_META[pathname] || PAGE_META['/seller/dashboard']

  return (
    <div className="md-topbar">
      <div className="md-topbar-title">
        <button type="button" className="md-menu-btn" onClick={onOpenMenu} aria-label="Open menu">
          <IconMenu size={20} />
        </button>
        <div>
          <h1>{meta.title}</h1>
          <p>Welcome back, {userName || 'seller'} — {meta.subtitle}</p>
        </div>
      </div>
      <div className="md-topbar-right">
        <button type="button" className="md-icon-btn" aria-label="Notifications">
          <IconBell size={20} />
          <span className="md-notif-dot"></span>
        </button>
        <div className="md-topbar-avatar" aria-hidden="true">{initials(userName)}</div>
      </div>
    </div>
  )
}
