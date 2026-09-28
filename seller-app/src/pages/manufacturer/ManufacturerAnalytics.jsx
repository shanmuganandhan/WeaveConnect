import { useMemo } from 'react'
import { useManufacturer } from '../../context/ManufacturerContext'
import { formatINR, formatCompact } from '../../utils/format'
import { IconCoin, IconTruck, IconBag, IconGift } from '../../components/ui/Icons'
import { ErrorState, EmptyState } from '../../components/ui/States'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts'
import { orderAmount } from './manufacturerUtils'

const COLORS = ['#9c8a6b', '#2e5d43', '#b8a27c', '#6b8f7a', '#d8c3a0', '#a3b8aa']
const STATUS_COLORS = {
  pending: '#d8a24a', accepted: '#9c8a6b', shipped: '#5b7fb5',
  delivered: '#2e8b57', cancelled: '#d64545',
}

export default function ManufacturerAnalytics() {
  const { products, orders, analytics, loading, error, refresh } = useManufacturer()

  const revenueTrend = useMemo(() => {
    if (analytics?.weeklySales?.length) return analytics.weeklySales
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
          return o.status !== 'cancelled' && t >= start && t <= end
        })
        .reduce((sum, o) => sum + orderAmount(o), 0)
      out.push({ day: day.toLocaleDateString('en-US', { weekday: 'short' }), revenue: sales })
    }
    return out
  }, [orders, analytics])

  const categoryData = useMemo(() => {
    const counts = products.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1
      return acc
    }, {})
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [products])

  const statusData = useMemo(() => {
    const counts = orders.reduce((acc, o) => {
      const k = o.status.toLowerCase()
      acc[k] = (acc[k] || 0) + 1
      return acc
    }, {})
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [orders])

  const topProducts = useMemo(
    () => [...products].sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0)).slice(0, 5),
    [products]
  )

  if (loading) return <div className="md-page-title">Loading analytics…</div>
  if (error) return <ErrorState title="Couldn't load analytics" message={error} onRetry={refresh} />

  const stats = [
    { id: 1, label: 'Total Revenue', value: formatINR(analytics?.totalRevenue || 0), icon: <IconCoin size={22} /> },
    { id: 2, label: 'Units Sold', value: String(analytics?.totalSold || 0), icon: <IconBag size={22} /> },
    { id: 3, label: 'Total Orders', value: String(analytics?.totalOrders || 0), icon: <IconTruck size={22} /> },
    { id: 4, label: 'Avg. Order Value', value: formatINR(analytics?.avgOrderValue || 0), icon: <IconGift size={22} /> },
  ]

  return (
    <div className="md-analytics-page">
      <div className="md-page-title">
        <h1>Analytics</h1>
        <span>{analytics?.weekChange >= 0 ? '+' : ''}{analytics?.weekChange || 0}% revenue this week</span>
      </div>

      <div className="md-stats">
        {stats.map((s, index) => (
          <article key={s.id} className="md-stat-card" style={{ '--index': index }}>
            <div className="md-stat-icon">{s.icon}</div>
            <div className="md-stat-body">
              <span className="md-stat-label">{s.label}</span>
              <strong className="md-stat-value">{s.value}</strong>
            </div>
          </article>
        ))}
      </div>

      <div className="md-sales-wrap">
        <article className="md-card md-chart-card">
          <div className="md-card-header">
            <h2>Weekly Revenue</h2>
            <span className="md-card-sub">Last 7 days</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="mRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9c8a6b" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#9c8a6b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d2620" />
              <XAxis dataKey="day" stroke="#9c8a6b" tickLine={false} axisLine={false} />
              <YAxis stroke="#9c8a6b" tickLine={false} axisLine={false} tickFormatter={(v) => formatCompact(v)} />
              <Tooltip contentStyle={{ background: '#241e17', border: '1px solid #3a3228', borderRadius: 8 }} formatter={(v) => [formatINR(Number(v)), 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#9c8a6b" fill="url(#mRevenue)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </article>

        <article className="md-card md-chart-card">
          <div className="md-card-header">
            <h2>Category Mix</h2>
            <span className="md-card-sub">{products.length} products</span>
          </div>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {categoryData.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#241e17', border: '1px solid #3a3228', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState compact title="No products yet." />
          )}
        </article>
      </div>

      <div className="md-sales-wrap">
        <article className="md-card">
          <div className="md-card-header">
            <h2>Order Status</h2>
            <span className="md-card-sub">{orders.length} orders</span>
          </div>
          <div className="md-status-list">
            {statusData.map((s) => (
              <div key={s.name} className="md-status-list-item">
                <span className="md-status-dot" style={{ background: STATUS_COLORS[s.name] || '#9c8a6b' }} />
                <span>{s.name}</span>
                <strong>{s.value}</strong>
              </div>
            ))}
            {statusData.length === 0 && <EmptyState compact title="No orders yet." />}
          </div>
        </article>

        <article className="md-card">
          <div className="md-card-header">
            <h2>Top Selling</h2>
            <span className="md-card-sub">By units sold</span>
          </div>
          <ul className="md-top-list">
            {topProducts.map((p, i) => (
              <li key={p._id}>
                <span className="md-top-rank">{i + 1}</span>
                <div>
                  <strong>{p.name}</strong>
                  <small>{p.category} · {p.soldCount || 0} sold</small>
                </div>
                <span className="md-top-price">{formatINR(p.price)}</span>
              </li>
            ))}
            {topProducts.length === 0 && <EmptyState compact title="No products yet." />}
          </ul>
        </article>
      </div>
    </div>
  )
}
