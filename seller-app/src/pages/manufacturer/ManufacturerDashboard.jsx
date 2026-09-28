import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useManufacturer } from '../../context/ManufacturerContext'
import { formatINR, formatCompact } from '../../utils/format'
import { orderId } from '../../utils/date'
import {
  IconPackage, IconPlus, IconTruck, IconUser,
  IconCoin, IconClock, IconBag, IconBox,
} from '../../components/ui/Icons'
import { EmptyState } from '../../components/ui/States'
import { titleCase, orderCustomer, orderProducts, orderAmount } from './manufacturerUtils'

const ICONS = {
  revenue: <IconCoin size={22} />,
  products: <IconPackage size={22} />,
  orders: <IconTruck size={22} />,
  pending: <IconClock size={22} />,
}

const DAY = 24 * 60 * 60 * 1000

function StatsCards({ stats }) {
  return (
    <div className="md-stats">
      {stats.map((stat, index) => (
        <article key={stat.id} className="md-stat-card" style={{ '--index': index }}>
          <div className="md-stat-icon">{ICONS[stat.icon]}</div>
          <div className="md-stat-body">
            <span className="md-stat-label">{stat.label}</span>
            <strong className="md-stat-value">{stat.value}</strong>
            <span className={`md-stat-trend ${stat.up ? 'up' : 'down'}`}>
              {stat.trend}
            </span>
          </div>
        </article>
      ))}
    </div>
  )
}

function SalesSummary({ weeklySales, summary }) {
  const max = Math.max(...weeklySales.map((d) => d.sales), 1)
  return (
    <div className="md-sales-wrap">
      <article className="md-card md-chart-card">
        <div className="md-card-header">
          <h2>Sales Summary</h2>
          <span className="md-card-sub">Last 7 days</span>
        </div>
        <div className="md-chart">
          {weeklySales.map((d) => (
            <div key={d.day} className="md-chart-col">
              <span className="md-chart-value">{formatCompact(d.sales)}</span>
              <div className="md-chart-bar" style={{ height: `${Math.max((d.sales / max) * 100, 6)}%` }}></div>
              <span className="md-chart-day">{d.day}</span>
            </div>
          ))}
        </div>
      </article>

      <article className="md-card md-summary-card">
        <div className="md-card-header">
          <h2>Performance</h2>
          <span className="md-card-sub">last 7 days</span>
        </div>
        <ul className="md-summary-list">
          <li>
            <span className="md-summary-label">Week Revenue</span>
            <strong>{formatINR(summary.totalThisWeek)}</strong>
          </li>
          <li>
            <span className="md-summary-label">Growth</span>
            <strong className={summary.weekChange >= 0 ? 'md-summary-positive' : ''}>
              {summary.weekChange >= 0 ? '+' : ''}{summary.weekChange}%
            </strong>
          </li>
          <li>
            <span className="md-summary-label">Orders This Week</span>
            <strong>{summary.ordersThisWeek}</strong>
          </li>
          <li>
            <span className="md-summary-label">Avg. Order Value</span>
            <strong>{formatINR(summary.avgOrderValue)}</strong>
          </li>
          <li>
            <span className="md-summary-label">Best Category</span>
            <strong>{summary.bestCategory}</strong>
          </li>
        </ul>
        <div className="md-summary-donut" aria-hidden="true">
          <div className="md-donut-inner">
            <strong>{summary.ordersThisWeek}</strong>
            <span>orders</span>
          </div>
        </div>
      </article>
    </div>
  )
}

function RecentOrders({ orders, onViewAll }) {
  return (
    <article className="md-card">
      <div className="md-card-header">
        <h2>Recent Orders</h2>
        <button type="button" className="md-link-btn" onClick={onViewAll}>View all</button>
      </div>
      <div className="md-table-wrap">
        <table className="md-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Product</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.slice(0, 6).map((order) => (
              <tr key={order._id}>
                <td className="md-cell-order">{orderId(order._id)}</td>
                <td>
                  <strong>{orderCustomer(order)}</strong>
                  <small>{order.buyer?.email || ''}</small>
                </td>
                <td>{orderProducts(order)}</td>
                <td className="md-cell-amount">{formatINR(orderAmount(order))}</td>
                <td>
                  <span className={`md-status md-status-${order.status.toLowerCase()}`}>
                    {titleCase(order.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && (
          <EmptyState compact icon={<IconBag size={16} />} title="No orders yet." />
        )}
      </div>
    </article>
  )
}

function QuickActions({ onNavigate }) {
  const actions = [
    { to: '/seller/products/add', label: 'Add New Product', desc: 'List a new saree', icon: <IconPlus size={20} /> },
    { to: '/seller/products', label: 'Manage Products', desc: 'Edit stock & prices', icon: <IconBox size={20} /> },
    { to: '/seller/orders', label: 'View Orders', desc: 'Process new orders', icon: <IconBag size={20} /> },
    { to: '/seller/profile', label: 'Update Profile', desc: 'Business details', icon: <IconUser size={20} /> },
  ]
  return (
    <div className="md-quick-grid">
      {actions.map((action) => (
        <button key={action.to} type="button" className="md-quick-card" onClick={() => onNavigate(action.to)}>
          <span className="md-quick-icon">{action.icon}</span>
          <span className="md-quick-text">
            <strong>{action.label}</strong>
            <small>{action.desc}</small>
          </span>
        </button>
      ))}
    </div>
  )
}

export default function ManufacturerDashboard() {
  const { products, orders, analytics } = useManufacturer()
  const navigate = useNavigate()

  const stats = useMemo(() => {
    const active = orders.filter((o) => o.status !== 'cancelled')
    const revenue = active.reduce((sum, o) => sum + orderAmount(o), 0)
    const now = Date.now()
    const cutoff = now - 7 * DAY
    const prevCutoff = now - 14 * DAY
    const thisWeek = active
      .filter((o) => new Date(o.createdAt).getTime() >= cutoff)
      .reduce((sum, o) => sum + orderAmount(o), 0)
    const prevWeek = active
      .filter((o) => {
        const t = new Date(o.createdAt).getTime()
        return t >= prevCutoff && t < cutoff
      })
      .reduce((sum, o) => sum + orderAmount(o), 0)
    const growth = prevWeek > 0 ? Math.round(((thisWeek - prevWeek) / prevWeek) * 100) : 0

    return [
      { id: 1, label: 'Total Revenue', value: formatCompact(revenue), trend: `${growth >= 0 ? '+' : ''}${growth}%`, up: growth >= 0, icon: 'revenue' },
      { id: 2, label: 'Total Products', value: String(products.length), trend: `${products.length} live`, up: true, icon: 'products' },
      { id: 3, label: 'Total Orders', value: orders.length.toLocaleString('en-IN'), trend: `${active.length} active`, up: true, icon: 'orders' },
      { id: 4, label: 'Pending Orders', value: String(orders.filter((o) => o.status === 'pending').length), trend: 'awaiting action', up: false, icon: 'pending' },
    ]
  }, [orders, products])

  const weeklySales = useMemo(() => {
    if (analytics?.weeklySales && analytics.weeklySales.length > 0) return analytics.weeklySales
    const out = []
    const now = new Date()
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now)
      day.setDate(now.getDate() - i)
      const start = new Date(day).setHours(0, 0, 0, 0)
      const end = new Date(day).setHours(23, 59, 59, 999)
      const sales = orders
        .filter((o) => {
          const t = new Date(o.createdAt).getTime()
          return t >= start && t <= end && o.status !== 'cancelled'
        })
        .reduce((sum, o) => sum + orderAmount(o), 0)
      out.push({ day: day.toLocaleDateString('en-US', { weekday: 'short' }), sales })
    }
    return out
  }, [orders, analytics])

  const summary = useMemo(() => {
    if (analytics) {
      const week = orders.filter((o) => o.status !== 'cancelled' && new Date(o.createdAt).getTime() >= Date.now() - 7 * DAY)
      return {
        totalThisWeek: analytics.weekRevenue || 0,
        weekChange: analytics.weekChange || 0,
        bestCategory: analytics.bestCategory || '—',
        avgOrderValue: analytics.avgOrderValue || 0,
        ordersThisWeek: analytics.ordersThisWeek || week.length,
      }
    }
    const now = Date.now()
    const cutoff = now - 7 * DAY
    const active = orders.filter((o) => o.status !== 'cancelled')
    const week = active.filter((o) => new Date(o.createdAt).getTime() >= cutoff)
    const thisWeek = week.reduce((sum, o) => sum + orderAmount(o), 0)
    const prevWeek = active
      .filter((o) => {
        const t = new Date(o.createdAt).getTime()
        return t >= now - 14 * DAY && t < cutoff
      })
      .reduce((sum, o) => sum + orderAmount(o), 0)
    const weekChange = prevWeek > 0 ? Math.round(((thisWeek - prevWeek) / prevWeek) * 100) : 0
    const bestCategory = Object.entries(
      products.reduce((acc, p) => {
        acc[p.category] = (acc[p.category] || 0) + 1
        return acc
      }, {})
    ).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'
    return {
      totalThisWeek: thisWeek,
      weekChange,
      bestCategory,
      avgOrderValue: week.length > 0 ? Math.round(thisWeek / week.length) : 0,
      ordersThisWeek: week.length,
    }
  }, [orders, products, analytics])

  return (
    <>
      <StatsCards stats={stats} />
      <SalesSummary weeklySales={weeklySales} summary={summary} />
      <div className="md-dashboard-bottom">
        <RecentOrders orders={orders} onViewAll={() => navigate('/seller/orders')} />
        <QuickActions onNavigate={navigate} />
      </div>
    </>
  )
}
