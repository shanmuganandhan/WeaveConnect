import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useAdmin } from '../../context/AdminContext'
import { formatDate } from '../../utils/date'
import { IconLogout, IconCheck } from '../../components/ui/Icons'
import { initials, titleCase } from './adminUtils'
import { getAdminSettings, updateAdminSettings } from '../../api/adminApi'

const SETTINGS = [
  {
    id: 'orders',
    label: 'Order Defaults',
    desc: 'Default order status flow for new orders placed by buyers.',
    fields: [
      { key: 'orderFlow', label: 'Order Flow', type: 'text' },
      { key: 'autoAccept', label: 'Auto-accept orders', type: 'toggle' },
    ],
  },
  {
    id: 'manufacturers',
    label: 'Manufacturer Onboarding',
    desc: 'Control how new seller accounts are onboarded onto the platform.',
    fields: [
      { key: 'approvalRequired', label: 'Require admin approval', type: 'toggle' },
      { key: 'maxProducts', label: 'Max products per seller', type: 'text' },
    ],
  },
  {
    id: 'payments',
    label: 'Payments & Commission',
    desc: 'Platform commission charged per order placed through WeaveConnect.',
    fields: [
      { key: 'commission', label: 'Platform commission', type: 'text' },
      { key: 'payoutCycle', label: 'Manufacturer payout cycle', type: 'text' },
    ],
  },
]

export default function AdminSettings() {
  const { user, logout } = useAuth()
  const { analytics } = useAdmin()
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(SETTINGS[0].id)
  const [settings, setSettings] = useState(null)
  const [drafts, setDrafts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getAdminSettings()
      setSettings(res.data.settings || null)
    } catch (err) {
      setError(err.message || 'Could not load settings.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  const setValue = (group, key, value) => {
    setDrafts((prev) => ({ ...prev, [group]: { ...prev[group], [key]: value } }))
    setSaved(false)
  }

  const fieldValue = (group, key) => {
    if (drafts[group]?.[key] !== undefined) return drafts[group][key]
    const val = settings?.[key]
    return typeof val === 'boolean' ? (val ? 'Yes' : 'No') : (val ?? '')
  }

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const payload = {}
      Object.keys(drafts).forEach((groupId) => {
        Object.entries(drafts[groupId]).forEach(([key, value]) => {
          payload[key] = typeof settings[key] === 'boolean' ? value === 'Yes' : String(value).trim()
        })
      })
      if (Object.keys(payload).length === 0) {
        setSaved(true)
        return
      }
      const res = await updateAdminSettings(payload)
      setSettings(res.data.settings || { ...settings, ...payload })
      setDrafts({})
      setSaved(true)
    } catch (err) {
      setError(err.message || 'Could not save settings.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h2>Platform Settings</h2>
        <span className="admin-table-sub">Configure platform-wide behaviour for all portals.</span>
      </div>

      {loading ? (
        <div className="admin-chart-card">Loading settings…</div>
      ) : error ? (
        <div className="admin-chart-card">
          <p>{error}</p>
          <button type="button" className="admin-save-btn" onClick={load}>Try again</button>
        </div>
      ) : (
        SETTINGS.map((group) => (
          <div key={group.id} className="admin-chart-card" style={{ marginBottom: 16 }}>
            <button
              type="button"
              className="admin-settings-header"
              onClick={() => setExpanded((prev) => (prev === group.id ? null : group.id))}
              aria-expanded={expanded === group.id}
            >
              <span>
                <strong>{group.label}</strong>
                <small className="admin-table-sub">{group.desc}</small>
              </span>
              <span>{expanded === group.id ? '−' : '+'}</span>
            </button>

            {expanded === group.id && (
              <div className="admin-settings-body">
                {group.fields.map((field) => (
                  <div key={field.key} className="admin-settings-row">
                    <label className="admin-settings-label">{field.label}</label>
                    {field.type === 'toggle' ? (
                      <select
                        value={fieldValue(group.id, field.key)}
                        onChange={(e) => setValue(group.id, field.key, e.target.value)}
                      >
                        <option>Yes</option>
                        <option>No</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={fieldValue(group.id, field.key)}
                        onChange={(e) => setValue(group.id, field.key, e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}

      <div className="admin-chart-card">
        <div className="admin-settings-actions">
          <div>
            <h3>Save changes</h3>
            <p className="admin-table-sub">
              {saved
                ? 'Settings saved successfully.'
                : 'Changes are applied immediately for every portal.'}
            </p>
          </div>
          <button type="button" className="admin-save-btn" onClick={handleSave} disabled={saving || loading}>
            {saving ? 'Saving…' : (saved ? <><IconCheck size={14} /> Saved</> : 'Save Changes')}
          </button>
        </div>
      </div>

      <div className="admin-chart-card">
        <h3>Account</h3>
        <div className="admin-settings-account">
          <div className="admin-table-user">
            <div className="admin-avatar">{initials(user?.name)}</div>
            <div>
              <div className="admin-table-name">{user?.name}</div>
              <div className="admin-table-sub">
                {user?.email} · {titleCase(user?.role)} · Joined {formatDate(user?.createdAt)}
              </div>
            </div>
          </div>
          <button type="button" className="admin-delete-btn" onClick={handleLogout} title="Logout">
            <IconLogout size={15} />
          </button>
        </div>
        <p className="admin-table-sub" style={{ marginTop: 12 }}>
          {analytics?.totals?.totalUsers ?? 0} total users · {analytics?.totals?.totalOrders ?? 0} orders processed
        </p>
      </div>
    </div>
  )
}