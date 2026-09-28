import { useMemo } from 'react'
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useAdmin } from '../../context/AdminContext'
import { formatINR, formatCompact } from '../../utils/format'
import { CATEGORY_COLORS, STATUS_COLORS, titleCase } from './adminUtils'

export default function AdminAnalytics() {
  const { analytics, orders, products, users } = useAdmin()

  const revenueData = useMemo(() => {
    if (analytics?.revenueTrend && analytics.revenueTrend.length > 0) return analytics.revenueTrend
    return []
  }, [analytics])

  const categoryDistribution = useMemo(() => {
    const counts = analytics?.categoryDistribution
      ? { ...analytics.categoryDistribution }
      : products.reduce((acc, p) => {
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
    return []
  }, [analytics])

  const summaryCards = [
    { label: 'Total Revenue', value: formatINR(analytics?.totals?.totalRevenue || 0) },
    { label: 'Total Users', value: (analytics?.totals?.totalUsers ?? users.length).toLocaleString('en-IN') },
    { label: 'Total Orders', value: (analytics?.totals?.totalOrders ?? orders.length).toLocaleString('en-IN') },
    { label: 'Avg Order Value', value: formatINR(analytics?.totals?.avgOrderValue || 0) },
    { label: 'Pending Orders', value: (analytics?.totals?.pendingOrders ?? 0).toLocaleString('en-IN') },
    { label: 'Products', value: (analytics?.totals?.totalProducts ?? products.length).toLocaleString('en-IN') },
  ]

  return (
    <div className="admin-page">
      <div className="admin-stats-grid">
        {summaryCards.map((c) => (
          <div key={c.label} className="admin-stat-card">
            <div className="admin-stat-value">{c.value}</div>
            <div className="admin-stat-label">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="admin-charts-row">
        <div className="admin-chart-card wide">
          <h3>Monthly Revenue</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d4af37" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#d4af37" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#3a3228" />
              <XAxis dataKey="month" stroke="#9c8a6b" fontSize={12} />
              <YAxis stroke="#9c8a6b" fontSize={12} tickFormatter={formatCompact} />
              <Tooltip
                contentStyle={{ background: '#1a1612', border: '1px solid #3a3228', borderRadius: 8, color: '#fdf8f3' }}
                formatter={(val, name) => [name === 'revenue' ? formatINR(val) : Number(val).toLocaleString(), name === 'revenue' ? 'Revenue' : 'Orders']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#d4af37" fill="url(#revGrad2)" strokeWidth={2} name="Revenue" />
              <Area type="monotone" dataKey="orders" stroke="#1f6feb" fill="#1f6feb33" strokeWidth={2} name="Orders" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="admin-charts-row">
        <div className="admin-chart-card">
          <h3>Category Graph</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={categoryDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
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
    </div>
  )
}
