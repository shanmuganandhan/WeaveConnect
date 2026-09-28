import { IconBell, IconUser, IconTag, IconCoin, IconFactory, IconGear, IconPackage } from '../../components/ui/Icons'

export const STATUS_COLORS = {
  pending: '#c07a1d',
  accepted: '#1f6feb',
  shipped: '#1f6feb',
  delivered: '#2e8b57',
  cancelled: '#d64545',
  active: '#2e8b57',
  'out of stock': '#d64545',
  'low stock': '#c07a1d',
}

export const CATEGORY_COLORS = {
  Kanchipuram: '#d4af37',
  Banarasi: '#b4825a',
  Mysore: '#8b6f47',
  Patola: '#c07a1d',
  Pochampally: '#9c8a6b',
  Paithani: '#e8c56d',
}

export const WEEK = 7 * 24 * 60 * 60 * 1000

export const ACTIVITY_ICONS = {
  order: <IconPackage size={16} />,
  user: <IconUser size={16} />,
  product: <IconTag size={16} />,
  payment: <IconCoin size={16} />,
  manufacturer: <IconFactory size={16} />,
  system: <IconGear size={16} />,
  activity: <IconBell size={16} />,
}

export function titleCase(str) {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function initials(name) {
  return (name || 'A')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

export function productStatus(p) {
  if (p.isAvailable === false || p.stock <= 0) return 'Out of Stock'
  if (p.stock <= 5) return 'Low Stock'
  return 'Active'
}

export function orderProducts(o) {
  return (o.items || []).map((i) => i.product?.name || 'Product').join(', ')
}

export function orderAmount(o) {
  return o.totalAmount || 0
}

export function timeAgo(value) {
  if (!value) return ''
  const diff = Date.now() - new Date(value).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}
