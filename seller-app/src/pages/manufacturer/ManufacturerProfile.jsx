import { useState } from 'react'
import { useManufacturer } from '../../context/ManufacturerContext'
import { IconUser, IconShield, IconMail, IconPhone, IconCheck } from '../../components/ui/Icons'
import { ErrorState } from '../../components/ui/States'
import { initials } from './manufacturerUtils'

export default function ManufacturerProfile() {
  const { profile, loading, error, refresh, updateProfile } = useManufacturer()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [saved, setSaved] = useState(false)

  if (loading) return <div className="md-page-title">Loading profile…</div>
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
    <div className="md-profile-page">
      <div className="md-page-title">
        <h1>My Profile</h1>
        <span>Your account details on Weave Connect.</span>
      </div>

      <div className="md-profile-grid">
        <aside className="md-profile-card">
          <div className="md-profile-avatar">{initials(profile?.name)}</div>
          <h3>{profile?.name}</h3>
          <p className="md-profile-approved">
            {profile?.isApproved ? 'Approved seller' : 'Approval pending'}
          </p>
          <ul className="md-profile-meta">
            <li><IconUser size={15} /> {profile?.name}</li>
            <li><IconMail size={15} /> {profile?.email}</li>
            <li><IconPhone size={15} /> {profile?.phone || '—'}</li>
            <li><IconShield size={15} /> Member since {profile?.memberSince || '—'}</li>
          </ul>
        </aside>

        <div className="md-profile-form-wrap">
          <form className="md-card md-form-card" onSubmit={handleSave} noValidate>
            <h2>Account Details</h2>
            <div className="md-form-row">
              <label className="md-field">
                <span>Full Name</span>
                <input
                  type="text"
                  defaultValue={profile?.name || ''}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <label className="md-field">
                <span>Email</span>
                <input type="email" value={profile?.email || ''} disabled />
              </label>
            </div>
            <label className="md-field">
              <span>Phone</span>
              <input
                type="tel"
                defaultValue={profile?.phone || ''}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 98765 43210"
              />
            </label>
            <div className="md-modal-actions">
              <button type="submit" className="md-btn-primary">
                <IconCheck size={18} /> Save Changes
              </button>
              {saved && <span className="md-saved-note">Profile updated ✓</span>}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
