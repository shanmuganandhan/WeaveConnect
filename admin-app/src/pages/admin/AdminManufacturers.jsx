import { useState } from 'react'
import { useAdmin } from '../../context/AdminContext'
import { formatINR } from '../../utils/format'
import { IconTrash, IconBan, IconCheck, IconX } from '../../components/ui/Icons'
import { initials } from './adminUtils'

export default function Manufacturers() {
  const {
    manufacturers, manufacturerStats, approveManufacturer,
    disapproveManufacturer, blockUser, unblockUser, deleteUser,
  } = useAdmin()
  const [search, setSearch] = useState('')

  const filtered = manufacturers.filter(
    (m) =>
      (m.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.email || '').toLowerCase().includes(search.toLowerCase())
  )

  const statusOf = (m) => {
    if (m.isBlocked) return { label: 'Blocked', color: '#d64545' }
    if (m.approvalStatus === 'rejected') return { label: 'Rejected', color: '#d64545' }
    if (m.approvalStatus === 'pending' || m.isApproved === false) return { label: 'Pending Approval', color: '#c07a1d' }
    return { label: 'Active', color: '#2e8b57' }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h2>Manufacturers ({filtered.length})</h2>
        <input
          type="text"
          placeholder="Search manufacturers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="admin-search"
        />
      </div>
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Manufacturer</th>
              <th>Phone</th>
              <th>Since</th>
              <th>Products</th>
              <th>Orders</th>
              <th>Revenue</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => {
              const stat = manufacturerStats[m._id] || { orders: 0, revenue: 0 }
              const status = statusOf(m)
              return (
                <tr key={m._id}>
                  <td>
                    <div className="admin-table-user">
                      <div className="admin-avatar">{initials(m.name)}</div>
                      <div>
                        <div className="admin-table-name">{m.name}</div>
                        <div className="admin-table-sub">{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{m.phone || '—'}</td>
                  <td>{m.createdAt ? new Date(m.createdAt).getFullYear() : '—'}</td>
                  <td>{m.productCount || 0}</td>
                  <td>{stat.orders.toLocaleString('en-IN')}</td>
                  <td>{formatINR(stat.revenue)}</td>
                  <td>
                    <span className="admin-status-badge" style={{ color: status.color }}>{status.label}</span>
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      {(m.approvalStatus === 'pending' || m.isApproved === false) ? (
                        <button
                          type="button"
                          className="admin-approve-btn"
                          onClick={() => approveManufacturer(m._id)}
                          aria-label={`Approve ${m.name}`}
                          title="Approve manufacturer"
                        >
                          <IconCheck size={15} />
                        </button>
                      ) : m.approvalStatus !== 'rejected' ? (
                        <button
                          type="button"
                          className="admin-delete-btn"
                          onClick={() => {
                            if (window.confirm(`Revoke approval for "${m.name}"?`)) disapproveManufacturer(m._id)
                          }}
                          aria-label={`Revoke approval for ${m.name}`}
                          title="Revoke approval"
                        >
                          <IconX size={15} />
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="admin-delete-btn"
                        onClick={() => {
                          if (m.isBlocked) {
                            if (window.confirm(`Unblock "${m.name}"?`)) unblockUser(m._id)
                          } else if (window.confirm(`Block "${m.name}"? They will not be able to sign in.`)) {
                            blockUser(m._id)
                          }
                        }}
                        aria-label={m.isBlocked ? `Unblock ${m.name}` : `Block ${m.name}`}
                        title={m.isBlocked ? 'Unblock' : 'Block'}
                      >
                        <IconBan size={15} />
                      </button>
                      <button
                        type="button"
                        className="admin-delete-btn"
                        onClick={() => {
                          if (window.confirm(`Delete manufacturer "${m.name}"? This cannot be undone.`)) deleteUser(m._id)
                        }}
                        aria-label={`Delete ${m.name}`}
                      >
                        <IconTrash size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="admin-empty">No manufacturers found.</div>}
      </div>
    </div>
  )
}
