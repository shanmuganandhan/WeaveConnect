import { useState } from 'react'
import { useBuyer } from '../../context/BuyerContext'
import { formatDate } from '../../utils/date'
import { IconUser, IconMail, IconPhone, IconShield, IconCheck } from '../../components/ui/Icons'
import { ErrorState } from '../../components/ui/States'

export default function BuyerProfile() {
  const { profile, loading, error, refresh, updateProfile } = useBuyer()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [saved, setSaved] = useState(false)

  if (loading) return <div className="bd-content-message">Loading profile…</div>
  if (error) return <ErrorState title="Couldn't load your profile" message={error} onRetry={refresh} />

  const handleSave = async (e) => {
    e.preventDefault()
    const payload = {}
    if (name.trim() && name.trim() !== profile?.name) payload.name = name.trim()
    if (phone.trim() !== profile?.phone) payload.phone = phone.trim()
    await updateProfile(payload)
    setName('')
    setPhone('')
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="bd-profile">
      <section className="bd-card">
        <h2>My Profile</h2>
        <div className="bd-account-grid">
          <div className="bd-acct-item">
            <IconUser size={20} />
            <div>
              <strong>{profile?.name}</strong>
              <span>Full name</span>
            </div>
          </div>
          <div className="bd-acct-item">
            <IconMail size={20} />
            <div>
              <strong>{profile?.email}</strong>
              <span>Email</span>
            </div>
          </div>
          <div className="bd-acct-item">
            <IconPhone size={20} />
            <div>
              <strong>{profile?.phone || '—'}</strong>
              <span>Phone</span>
            </div>
          </div>
          <div className="bd-acct-item">
            <IconShield size={20} />
            <div>
              <strong>{formatDate(profile?.createdAt)}</strong>
              <span>Joined</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} noValidate className="bd-checkout-form">
          <div className="bd-form-row">
            <label className="bd-field">
              <span>Full Name</span>
              <input type="text" defaultValue={profile?.name || ''} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="bd-field">
              <span>Phone</span>
              <input type="tel" defaultValue={profile?.phone || ''} onChange={(e) => setPhone(e.target.value)} placeholder="+91 …" />
            </label>
          </div>
          <div className="bd-form-actions">
            <button type="submit" className="bd-checkout-btn">
              <IconCheck size={16} /> Save Changes
            </button>
            {saved && <span className="bd-saved-note">Profile updated ✓</span>}
          </div>
        </form>
      </section>
    </div>
  )
}
