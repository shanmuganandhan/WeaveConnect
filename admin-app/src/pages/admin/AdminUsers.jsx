import { useState } from 'react'
import { useAdmin } from '../../context/AdminContext'
import { formatDate } from '../../utils/date'
import { IconTrash, IconBan } from '../../components/ui/Icons'
import { initials, titleCase } from './adminUtils'

function userStatus(u) {
  if (u.isBlocked) return { label: 'Blocked', color: '#d64545' }
  if (u.role === 'manufacturer' && u.isApproved === false) return { label: 'Pending Approval', color: '#c07a1d' }
  return { label: 'Active', color: '#2e8b57' }
}

export default function Users() {
  const { users, activityMap, deleteUser, blockUser, unblockUser } = useAdmin()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')

  const filtered = users.filter((u) => {
    const matchSearch =
      (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'All' || titleCase(u.role) === roleFilter
    return matchSearch && matchRole
  })

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h2>Users ({filtered.length})</h2>
        <div className="admin-page-filters">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-search"
          />
          <div className="admin-filter-chips">
            {['All', 'Buyer', 'Manufacturer', 'Admin'].map((r) => (
              <button
                key={r}
                className={`admin-chip ${roleFilter === r ? 'active' : ''}`}
                onClick={() => setRoleFilter(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Activity</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => {
              const activity = activityMap[u._id]
              const status = userStatus(u)
              return (
                <tr key={u._id}>
                  <td>
                    <div className="admin-table-user">
                      <div className="admin-avatar">{initials(u.name)}</div>
                      <div>
                        <div className="admin-table-name">{u.name}</div>
                        <div className="admin-table-sub">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className={`admin-role-badge ${u.role}`}>{titleCase(u.role)}</span></td>
                  <td>{u.phone || '—'}</td>
                  <td><span className="admin-status-badge" style={{ color: status.color }}>{status.label}</span></td>
                  <td>{formatDate(u.createdAt)}</td>
                  <td className="admin-table-sub">{activity || '—'}</td>
                  <td>
                    <div className="admin-row-actions">
                      <button
                        type="button"
                        className="admin-delete-btn"
                        onClick={() => {
                          if (u.isBlocked) {
                            if (window.confirm(`Unblock "${u.name}"?`)) unblockUser(u._id)
                          } else if (window.confirm(`Block "${u.name}"? They will not be able to sign in.`)) {
                            blockUser(u._id)
                          }
                        }}
                        aria-label={u.isBlocked ? `Unblock ${u.name}` : `Block ${u.name}`}
                        title={u.isBlocked ? 'Unblock user' : 'Block user'}
                      >
                        <IconBan size={15} />
                      </button>
                      <button
                        type="button"
                        className="admin-delete-btn"
                        onClick={() => {
                          if (window.confirm(`Delete user "${u.name}"? This cannot be undone.`)) deleteUser(u._id)
                        }}
                        aria-label={`Delete ${u.name}`}
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
        {filtered.length === 0 && <div className="admin-empty">No users found.</div>}
      </div>
    </div>
  )
}
