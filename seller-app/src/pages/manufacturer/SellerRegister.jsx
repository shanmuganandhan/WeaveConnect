import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { IconUser, IconLock, IconEye, IconEyeOff, IconMail, IconPhone, IconAlert, IconArrowRight, IconArrowLeft } from '../../components/ui/Icons'
import '../../components/Auth.css'

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh',
]

function FieldError({ id, message }) {
  if (!message) return null
  return (
    <p className="field-error" id={id}>
      <IconAlert size={14} />
      {message}
    </p>
  )
}

export default function SellerRegister() {
  const { register } = useAuth()
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    businessName: '',
    businessAddress: '',
    city: '',
    state: '',
    pincode: '',
    description: '',
    password: '',
    confirmPassword: '',
    terms: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(false)
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const update = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Owner name is required'
    else if (form.name.trim().length < 3) e.name = 'Name must be at least 3 characters'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Please enter a valid email'
    if (!form.businessName.trim()) e.businessName = 'Business name is required'
    if (!form.city.trim()) e.city = 'City is required'
    if (!form.state) e.state = 'State is required'
    if (!form.pincode.trim()) e.pincode = 'Pincode is required'
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters'
    if (!form.confirmPassword) e.confirmPassword = 'Please confirm your password'
    else if (form.confirmPassword !== form.password) e.confirmPassword = 'Passwords do not match'
    if (!form.terms) e.terms = 'You must accept the Terms & Privacy Policy'
    return e
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    setFormError('')
    if (Object.keys(nextErrors).length > 0 || submitting) return
    setSubmitting(true)
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
        role: 'manufacturer',
        businessName: form.businessName.trim(),
        businessAddress: form.businessAddress.trim() || undefined,
        city: form.city.trim(),
        state: form.state,
        pincode: form.pincode.trim(),
        description: form.description.trim() || undefined,
      })
      setSuccess(true)
    } catch (err) {
      setFormError(err.message)
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <section className="auth-page">
        <div className="auth-bg">
          <div className="auth-orb auth-orb-1"></div>
          <div className="auth-orb auth-orb-2"></div>
        </div>
        <div className="auth-shell" style={{ justifyContent: 'center' }}>
          <div className="auth-card" style={{ maxWidth: 520, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <h2 style={{ marginBottom: 12 }}>Application Submitted!</h2>
            <p style={{ color: '#6b7280', marginBottom: 8 }}>
              Your seller account for <strong>{form.businessName}</strong> has been created.
            </p>
            <div className="notice-banner" style={{ marginBottom: 24, textAlign: 'left' }}>
              <IconAlert size={16} />
              Your account is now <strong>pending admin approval</strong>. You will be able to sign in once an admin reviews and approves your application.
            </div>
            <Link to="/seller/login" className="auth-btn" style={{ display: 'inline-flex', textDecoration: 'none' }}>
              <span>Go to Seller Login</span> <IconArrowRight />
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="auth-page" aria-labelledby="seller-register-title">
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
            <span className="auth-brand-name">WeaveConnect</span>
          </div>
          <div className="auth-brand-text">
            <h2>Become a <span>Seller</span></h2>
            <p>Join WeaveConnect and sell your handwoven silk sarees directly to buyers across India and the world.</p>
          </div>
          <ul className="auth-benefits">
            <li><span className="benefit-icon">📦</span> Reach thousands of buyers</li>
            <li><span className="benefit-icon">🏪</span> Free storefront for your products</li>
            <li><span className="benefit-icon">🤝</span> Direct payments, no middlemen</li>
          </ul>
        </aside>

        <div className="auth-card">
          <div className="auth-card-header">
            <h1 id="seller-register-title">Seller Registration</h1>
            <p>Already a seller? <Link to="/seller/login">Sign in</Link></p>
          </div>

          {formError && (
            <div className="notice-banner error-banner" role="alert">
              <IconAlert size={16} /> {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <h3 style={{ fontSize: 14, color: '#9ca3af', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Owner Details</h3>

            <div className="form-group">
              <label className="form-label" htmlFor="sr-name">Owner Name *</label>
              <div className="input-wrapper">
                <span className="input-icon"><IconUser /></span>
                <input id="sr-name" type="text" className={`form-input ${errors.name ? 'error' : ''}`} placeholder="e.g. Kumar" value={form.name} onChange={update('name')} />
              </div>
              <FieldError id="sr-name-error" message={errors.name} />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="sr-email">Email *</label>
              <div className="input-wrapper">
                <span className="input-icon"><IconMail /></span>
                <input id="sr-email" type="email" className={`form-input ${errors.email ? 'error' : ''}`} placeholder="you@example.com" value={form.email} onChange={update('email')} />
              </div>
              <FieldError id="sr-email-error" message={errors.email} />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="sr-phone">Phone</label>
              <div className="input-wrapper">
                <span className="input-icon"><IconPhone /></span>
                <input id="sr-phone" type="tel" className="form-input" placeholder="+91 98765 43210" value={form.phone} onChange={update('phone')} />
              </div>
            </div>

            <h3 style={{ fontSize: 14, color: '#9ca3af', margin: '20px 0 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Business Details</h3>

            <div className="form-group">
              <label className="form-label" htmlFor="sr-business">Business / Store Name *</label>
              <div className="input-wrapper">
                <span className="input-icon">🏪</span>
                <input id="sr-business" type="text" className={`form-input ${errors.businessName ? 'error' : ''}`} placeholder="e.g. Sri Lakshmi Silks" value={form.businessName} onChange={update('businessName')} />
              </div>
              <FieldError id="sr-business-error" message={errors.businessName} />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="sr-address">Business Address</label>
              <div className="input-wrapper">
                <span className="input-icon">📍</span>
                <input id="sr-address" type="text" className="form-input" placeholder="Street address" value={form.businessAddress} onChange={update('businessAddress')} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label" htmlFor="sr-city">City *</label>
                <input id="sr-city" type="text" className={`form-input ${errors.city ? 'error' : ''}`} placeholder="e.g. Kanchipuram" value={form.city} onChange={update('city')} />
                <FieldError id="sr-city-error" message={errors.city} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="sr-state">State *</label>
                <select id="sr-state" className={`form-input ${errors.state ? 'error' : ''}`} value={form.state} onChange={update('state')}>
                  <option value="">Select state</option>
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <FieldError id="sr-state-error" message={errors.state} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="sr-pincode">Pincode *</label>
              <input id="sr-pincode" type="text" className={`form-input ${errors.pincode ? 'error' : ''}`} placeholder="e.g. 631501" value={form.pincode} onChange={update('pincode')} />
              <FieldError id="sr-pincode-error" message={errors.pincode} />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="sr-desc">Description</label>
              <textarea id="sr-desc" className="form-input" rows={3} placeholder="Tell buyers about your products and craft..." value={form.description} onChange={update('description')} style={{ resize: 'vertical' }} />
            </div>

            <h3 style={{ fontSize: 14, color: '#9ca3af', margin: '20px 0 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Account Security</h3>

            <div className="form-group">
              <label className="form-label" htmlFor="sr-password">Password *</label>
              <div className="input-wrapper has-toggle">
                <span className="input-icon"><IconLock /></span>
                <input id="sr-password" type={showPassword ? 'text' : 'password'} className={`form-input ${errors.password ? 'error' : ''}`} placeholder="Min. 6 characters" value={form.password} onChange={update('password')} />
                <button type="button" className="toggle-btn" onClick={() => setShowPassword((p) => !p)}>{showPassword ? <IconEyeOff /> : <IconEye />}</button>
              </div>
              <FieldError id="sr-password-error" message={errors.password} />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="sr-confirm">Confirm Password *</label>
              <div className="input-wrapper has-toggle">
                <span className="input-icon"><IconLock /></span>
                <input id="sr-confirm" type={showConfirm ? 'text' : 'password'} className={`form-input ${errors.confirmPassword ? 'error' : ''}`} placeholder="Re-enter password" value={form.confirmPassword} onChange={update('confirmPassword')} />
                <button type="button" className="toggle-btn" onClick={() => setShowConfirm((p) => !p)}>{showConfirm ? <IconEyeOff /> : <IconEye />}</button>
              </div>
              <FieldError id="sr-confirm-error" message={errors.confirmPassword} />
            </div>

            <div className="form-group">
              <label className="checkbox-label" htmlFor="sr-terms">
                <input id="sr-terms" type="checkbox" checked={form.terms} onChange={update('terms')} />
                <span>I agree to the <a href="#footer" className="forgot-link">Terms of Service</a> and <a href="#footer" className="forgot-link">Privacy Policy</a></span>
              </label>
              <FieldError id="sr-terms-error" message={errors.terms} />
            </div>

            <button type="submit" className="auth-btn" disabled={submitting}>
              <span>{submitting ? 'Submitting...' : 'Submit Application'}</span>
              {submitting ? <span className="auth-btn-spinner" aria-hidden="true"></span> : <IconArrowRight />}
            </button>
          </form>

          <a href={`${import.meta.env.VITE_BUYER_APP_URL || 'http://localhost:3000'}`} className="auth-home-link">
            <IconArrowLeft size={16} /> Back to home
          </a>
        </div>
      </div>
    </section>
  )
}
