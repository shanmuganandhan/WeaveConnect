import { useState } from 'react'
import { useAdmin } from '../../context/AdminContext'
import { IconCheck, IconX } from '../../components/ui/Icons'
import { initials, timeAgo } from './adminUtils'

export default function AdminSellerRequests() {
  const { pendingManufacturers, approveManufacturer, rejectManufacturer } = useAdmin()
  const [search, setSearch] = useState('')

  const filtered = pendingManufacturers.filter(
    (m) =>
      (m.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.businessName || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h2>Seller Requests ({filtered.length})</h2>
        <input
          type="text"
          placeholder="Search by name, email, or business..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="admin-search"
        />
      </div>

      {filtered.length === 0 && (
        <div className="admin-empty">No pending seller requests.</div>
      )}

      {filtered.length > 0 && (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Business</th>
                <th>Owner</th>
                <th>Contact</th>
                <th>Location</th>
                <th>Applied</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m._id}>
                  <td>
                    <div className="admin-table-user">
                      <div className="admin-avatar">{initials(m.businessName || m.name)}</div>
                      <div>
                        <div className="admin-table-name">{m.businessName || '—'}</div>
                        <div className="admin-table-sub">{m.description || 'No description'}</div>
                      </div>
                    </div>
                  </td>
                  <td>{m.name}</td>
                  <td>
                    <div>{m.email}</div>
                    <div className="admin-table-sub">{m.phone || '—'}</div>
                  </td>
                  <td>
                    <div>{[m.city, m.state].filter(Boolean).join(', ') || '—'}</div>
                    <div className="admin-table-sub">{m.pincode || ''}</div>
                  </td>
                  <td>{timeAgo(m.createdAt)}</td>
                  <td>
                    <div className="admin-row-actions">
                      <button
                        type="button"
                        className="admin-approve-btn"
                        onClick={() => approveManufacturer(m._id)}
                        title="Approve"
                      >
                        <IconCheck size={15} /> Approve
                      </button>
                      <button
                        type="button"
                        className="admin-delete-btn"
                        onClick={() => {
                          if (window.confirm(`Reject "${m.businessName || m.name}"?`))
                            rejectManufacturer(m._id)
                        }}
                        title="Reject"
                      >
                        <IconX size={15} /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
