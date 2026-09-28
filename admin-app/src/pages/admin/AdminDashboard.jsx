import { useMemo } from 'react'
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useAdmin } from '../../context/AdminContext'
import { formatINR, formatCompact } from '../../utils/format'
import { orderId } from '../../utils/date'
import {
  ACTIVITY_ICONS, CATEGORY_COLORS, STATUS_COLORS, WEEK,
  titleCase, orderAmount, timeAgo,
} from './adminUtils'

function StatCard({ label, value, growth, format }) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-value">
        {format === 'currency' ? formatINR(value) : Number(value).toLocaleString('en-IN')}
      </div>
      <div className="admin-stat-label">{label}</div>
      {growth !== undefined && (
        <div className={`admin-stat-growth ${growth >= 0 ? 'positive' : 'negative'}`}>
          {growth >= 0 ? '↑' : '↓'} {Math.abs(growth)}%
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { users, products, orders, analytics } = useAdmin()

  const adminStats = useMemo(() => {
    const nonCancelled = orders.filter((o) => o.status !== 'cancelled')
    const totalRevenue = nonCancelled.reduce((sum, o) => sum + orderAmount(o), 0)
    const now = Date.now()
    const countSince = (items, since) => items.filter((x) => new Date(x.createdAt).getTime() >= since).length
    const revenueSince = (items, since) => items
      .filter((o) => o.status !== 'cancelled' && new Date(o.createdAt).getTime() >= since)
      .reduce((sum, o) => sum + orderAmount(o), 0)
    const growth = (cur, prev) => (prev > 0 ? Math.round(((cur - prev) / prev) * 100) : 0)

    const manufacturers = users.filter((u) => u.role === 'manufacturer')
    const distinctBuyers = new Set(nonCancelled.map((o) => o.buyer?._id || o.buyer).filter(Boolean)).size

    const revThis = revenueSince(orders, now - WEEK)
    const revPrev = revenueSince(orders, now - 2 * WEEK) - revThis
    const ordThis = countSince(orders, now - WEEK)
    const ordPrev = countSince(orders, now - 2 * WEEK) - ordThis
    const usrThis = countSince(users, now - WEEK)
    const usrPrev = countSince(users, now - 2 * WEEK) - usrThis
    const manThis = countSince(manufacturers, now - WEEK)
    const manPrev = countSince(manufacturers, now - 2 * WEEK) - manThis
    const prdThis = countSince(products, now - WEEK)
    const prdPrev = countSince(products, now - 2 * WEEK) - prdThis

    return {
      totalRevenue,
      revenueGrowth: growth(revThis, revPrev),
      totalUsers: users.length,
      usersGrowth: growth(usrThis, usrPrev),
      totalManufacturers: manufacturers.length,
      manufacturersGrowth: growth(manThis, manPrev),
      totalProducts: products.length,
      productsGrowth: growth(prdThis, prdPrev),
      totalOrders: orders.length,
      ordersGrowth: growth(ordThis, ordPrev),
      pendingOrders: orders.filter((o) => o.status === 'pending' || o.status === 'accepted').length,
      avgOrderValue: nonCancelled.length > 0 ? Math.round(totalRevenue / nonCancelled.length) : 0,
      conversionRate: users.length > 0 ? Number(((distinctBuyers / users.length) * 100).toFixed(1)) : 0,
      conversionGrowth: 0,
    }
  }, [users, products, orders])

  const revenueData = useMemo(() => {
    if (analytics?.revenueTrend && analytics.revenueTrend.length > 0) return analytics.revenueTrend
    const rows = []
    const now = new Date()
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const start = d.getTime()
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime()
      const monthOrders = orders.filter((o) => {
        const t = new Date(o.createdAt).getTime()
        return t >= start && t < end
      })
      rows.push({
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        revenue: monthOrders.filter((o) => o.status !== 'cancelled').reduce((sum, o) => sum + orderAmount(o), 0),
        orders: monthOrders.length,
      })
    }
    return rows
  }, [analytics, orders])

  const categoryDistribution = useMemo(() => {
    if (analytics?.categoryDistribution) {
      return Object.entries(analytics.categoryDistribution).map(([name, value]) => ({
        name,
        value,
        color: CATEGORY_COLORS[name] || '#d4af37',
      }))
    }
    const counts = products.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1
      return acc
    }, {})
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      color: CATEGORY_COLORS[name] || '#d4af37',
    }))
  }, [analytics, products])

  const orderStatusData = useMemo(() => {
    const counts = analytics?.orderStatus
      ? { ...analytics.orderStatus }
      : orders.reduce((acc, o) => {
          acc[o.status] = (acc[o.status] || 0) + 1
          return acc
        }, {})
    return Object.entries(counts).map(([name, value]) => ({
      name: titleCase(name),
      value,
      color: STATUS_COLORS[name] || '#9c8a6b',
    }))
  }, [analytics, orders])

  const userGrowthData = useMemo(() => {
    if (analytics?.userGrowth && analytics.userGrowth.length > 0) return analytics.userGrowth
    const rows = []
    const now = new Date()
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const start = d.getTime()
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime()
      const monthUsers = users.filter((u) => {
        const t = new Date(u.createdAt).getTime()
        return t >= start && t < end
      })
      rows.push({
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        buyers: monthUsers.filter((u) => u.role === 'buyer').length,
        manufacturers: monthUsers.filter((u) => u.role === 'manufacturer').length,
      })
    }
    return rows
  }, [analytics, users])

  const recentActivity = useMemo(() => {
    const items = []
    ;[...orders]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6)
      .forEach((o) => {
        items.push({
          id: `order-${o._id}`,
          icon: 'order',
          text: `New order ${orderId(o._id)} placed by ${o.buyer?.name || 'a buyer'}`,
          ts: new Date(o.createdAt).getTime(),
        })
      })
    ;[...users]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 4)
      .forEach((u) => {
        items.push({
          id: `user-${u._id}`,
          icon: 'user',
          text: `New ${titleCase(u.role)} registered: ${u.name}`,
          ts: new Date(u.createdAt).getTime(),
        })
      })
    return items
      .sort((a, b) => b.ts - a.ts)
      .map((item) => ({ ...item, time: timeAgo(item.ts) }))
  }, [orders, users])

  return (
    <div className="admin-page">
      <div className="admin-stats-grid">
        <StatCard label="Total Revenue" value={adminStats.totalRevenue} growth={adminStats.revenueGrowth} format="currency" />
        <StatCard label="Total Users" value={adminStats.totalUsers} growth={adminStats.usersGrowth} />
        <StatCard label="Manufacturers" value={adminStats.totalManufacturers} growth={adminStats.manufacturersGrowth} />
        <StatCard label="Products" value={adminStats.totalProducts} growth={adminStats.productsGrowth} />
        <StatCard label="Total Orders" value={adminStats.totalOrders} growth={adminStats.ordersGrowth} />
        <StatCard label="Pending Orders" value={adminStats.pendingOrders} />
        <StatCard label="Avg Order Value" value={adminStats.avgOrderValue} format="currency" />
        <StatCard label="Conversion Rate" value={adminStats.conversionRate} growth={adminStats.conversionGrowth} />
      </div>

      <div className="admin-charts-row">
        <div className="admin-chart-card wide">
          <h3>Revenue & Orders Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d4af37" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#d4af37" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ordGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1f6feb" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#1f6feb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#3a3228" />
              <XAxis dataKey="month" stroke="#9c8a6b" fontSize={12} />
              <YAxis stroke="#9c8a6b" fontSize={12} tickFormatter={formatCompact} />
              <Tooltip
                contentStyle={{ background: '#1a1612', border: '1px solid #3a3228', borderRadius: 8, color: '#fdf8f3' }}
                formatter={(val, name) => [name === 'revenue' ? formatINR(val) : Number(val).toLocaleString(), name === 'revenue' ? 'Revenue' : 'Orders']}
              />
              <Legend wrapperStyle={{ color: '#9c8a6b' }} />
              <Area type="monotone" dataKey="revenue" stroke="#d4af37" fill="url(#revGrad)" strokeWidth={2} name="Revenue" />
              <Area type="monotone" dataKey="orders" stroke="#1f6feb" fill="url(#ordGrad)" strokeWidth={2} name="Orders" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="admin-charts-row">
        <div className="admin-chart-card">
          <h3>Category Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={categoryDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
              >
                {categoryDistribution.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1a1612', border: '1px solid #3a3228', borderRadius: 8, color: '#fdf8f3' }} />
              <Legend wrapperStyle={{ color: '#9c8a6b', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="admin-chart-card">
          <h3>Order Status</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={orderStatusData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#3a3228" horizontal={false} />
              <XAxis type="number" stroke="#9c8a6b" fontSize={12} />
              <YAxis type="category" dataKey="name" stroke="#9c8a6b" fontSize={12} width={90} />
              <Tooltip contentStyle={{ background: '#1a1612', border: '1px solid #3a3228', borderRadius: 8, color: '#fdf8f3' }} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {orderStatusData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="admin-chart-card">
          <h3>User Growth</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3a3228" />
              <XAxis dataKey="month" stroke="#9c8a6b" fontSize={12} />
              <YAxis stroke="#9c8a6b" fontSize={12} />
              <Tooltip contentStyle={{ background: '#1a1612', border: '1px solid #3a3228', borderRadius: 8, color: '#fdf8f3' }} />
              <Legend wrapperStyle={{ color: '#9c8a6b' }} />
              <Bar dataKey="buyers" fill="#d4af37" radius={[4, 4, 0, 0]} name="Buyers" />
              <Bar dataKey="manufacturers" fill="#b4825a" radius={[4, 4, 0, 0]} name="Manufacturers" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="admin-charts-row">
        <div className="admin-chart-card wide">
          <h3>Recent Activity</h3>
          <div className="admin-activity-list">
            {recentActivity.map((item) => (
              <div key={item.id} className="admin-activity-item">
                <span className="admin-activity-icon">{ACTIVITY_ICONS[item.icon]}</span>
                <span className="admin-activity-text">{item.text}</span>
                <span className="admin-activity-time">{item.time}</span>
              </div>
            ))}
            {recentActivity.length === 0 && <div className="admin-empty">No activity yet.</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
