import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { IconUser, IconLock, IconEye, IconEyeOff, IconShield, IconAlert, IconCheck, IconArrowRight, IconArrowLeft } from '../components/ui/Icons'
import '../components/Auth.css'

export default function AdminLogin() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(false)
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const validate = () => {
    const nextErrors = {}
    if (!email.trim()) nextErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) nextErrors.email = 'Please enter a valid email address'
    if (!password) nextErrors.password = 'Password is required'
    else if (password.length < 6) nextErrors.password = 'Password must be at least 6 characters'
    return nextErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    setFormError('')
    if (Object.keys(nextErrors).length > 0 || submitting) return
    setSubmitting(true)
    try {
      const user = await login({ email: email.trim(), password, persist: true })
      setSuccess(true)
      setTimeout(() => {
        navigate('/admin/dashboard', { replace: true })
      }, 500)
    } catch (err) {
      setFormError(err.message)
      setSubmitting(false)
    }
  }

  const handleClearError = (field) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  return (
    <section className="auth-page" aria-labelledby="admin-login-title">
      <div className="auth-bg">
        <div className="auth-orb auth-orb-1"></div>
        <div className="auth-orb auth-orb-2"></div>
      </div>

      <div className="auth-shell">
        <aside className="auth-brand-panel">
          <div className="auth-brand-logo">
            <svg width="40" height="40" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <path d="M16 2L4 6v20l12 4 12-4V6L16 2z" stroke="#d4af37" strokeWidth="2" />
              <path d="M16 6v20M8 10l8 2.5 8-2.5M8 16l8 2.5 8-2.5" stroke="#d4af37" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="auth-brand-name">WeaveConnect Admin</span>
          </div>
          <div className="auth-brand-text">
            <h2>Admin <span>Dashboard</span></h2>
            <p>Manage sellers, buyers, and platform operations from a single dashboard.</p>
          </div>
          <ul className="auth-benefits">
            <li><span className="benefit-icon"><IconShield size={18} /></span> Secure admin access</li>
            <li><span className="benefit-icon">📊</span> Real-time analytics</li>
            <li><span className="benefit-icon">👥</span> Manage manufacturers & buyers</li>
          </ul>
        </aside>

        <div className="auth-card">
          <div className="auth-card-header">
            <h1 id="admin-login-title">Admin Sign In</h1>
            <p>Authorized personnel only</p>
          </div>

          {formError && (
            <div className="notice-banner error-banner" role="alert">
              <IconAlert size={16} />
              {formError}
            </div>
          )}

          {success && (
            <div className="success-banner" role="status">
              <IconCheck />
              Login successful! Redirecting to dashboard…
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="admin-email">Admin Email</label>
              <div className="input-wrapper">
                <span className="input-icon"><IconUser /></span>
                <input
                  id="admin-email"
                  type="email"
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="admin@weaveconnect.com"
                  value={email}
                  autoComplete="email"
                  onChange={(e) => { setEmail(e.target.value); handleClearError('email') }}
                  aria-invalid={!!errors.email}
                />
              </div>
              {errors.email && <p className="field-error"><IconAlert size={14} /> {errors.email}</p>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="admin-password">Password</label>
              <div className="input-wrapper has-toggle">
                <span className="input-icon"><IconLock /></span>
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  className={`form-input ${errors.password ? 'error' : ''}`}
                  placeholder="Enter admin password"
                  value={password}
                  autoComplete="current-password"
                  onChange={(e) => { setPassword(e.target.value); handleClearError('password') }}
                  aria-invalid={!!errors.password}
                />
                <button type="button" className="toggle-btn" onClick={() => setShowPassword((p) => !p)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
              {errors.password && <p className="field-error"><IconAlert size={14} /> {errors.password}</p>}
            </div>

            <button type="submit" className="auth-btn" disabled={submitting}>
              <span>{submitting ? 'Signing in…' : 'Sign In'}</span>
              {submitting ? <span className="auth-btn-spinner" aria-hidden="true"></span> : <IconArrowRight />}
            </button>
          </form>

          <a href={`${import.meta.env.VITE_BUYER_APP_URL || 'http://localhost:3000'}`} className="auth-home-link">
            <IconArrowLeft size={16} />
            Back to WeaveConnect
          </a>
        </div>
      </div>
    </section>
  )
}
