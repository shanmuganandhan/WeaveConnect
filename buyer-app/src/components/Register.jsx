import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth, homeRouteFor } from '../context/AuthContext'
import { IconUser, IconLock, IconEye, IconEyeOff, IconMail, IconPhone, IconShield, IconCert, IconTruck, IconAlert, IconCheck, IconArrowRight, IconArrowLeft } from './ui/Icons'
import './Auth.css'

const benefits = [
  { icon: <IconShield size={18} />, text: 'Exclusive member-only collections' },
  { icon: <IconCert size={18} />, text: 'Authenticity guaranteed on every saree' },
  { icon: <IconTruck size={18} />, text: 'Free shipping on orders over ₹15,000' },
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

function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
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
    const nextErrors = {}
    if (!form.name.trim()) {
      nextErrors.name = 'Full name is required'
    } else if (form.name.trim().length < 3) {
      nextErrors.name = 'Name must be at least 3 characters'
    }
    if (!form.email.trim()) {
      nextErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = 'Please enter a valid email address'
    }
    if (form.phone.trim() && !/^[0-9+\-\s]{10,15}$/.test(form.phone.trim())) {
      nextErrors.phone = 'Please enter a valid phone number'
    }
    if (!form.password) {
      nextErrors.password = 'Password is required'
    } else if (form.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters'
    } else if (!/[a-zA-Z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      nextErrors.password = 'Password must contain letters and numbers'
    }
    if (!form.confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password'
    } else if (form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = 'Passwords do not match'
    }
    if (!form.terms) {
      nextErrors.terms = 'You must accept the Terms & Privacy Policy'
    }
    return nextErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    setSuccess(false)
    setFormError('')
    if (Object.keys(nextErrors).length > 0 || submitting) return
    setSubmitting(true)
    try {
      const user = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
        role: 'buyer',
      })
      setSuccess(true)
      setForm({ name: '', email: '', phone: '', password: '', confirmPassword: '', terms: false })
      setShowPassword(false)
      setShowConfirm(false)
      setTimeout(() => {
        navigate(homeRouteFor(user.role), { replace: true })
      }, 600)
    } catch (err) {
      setFormError(err.message)
      if (err.fieldErrors) {
        setErrors((prev) => ({ ...prev, ...err.fieldErrors }))
      }
      setSubmitting(false)
    }
  }

  return (
    <section className="auth-page" aria-labelledby="register-title">
      <div className="auth-bg">
        <div className="auth-orb auth-orb-1"></div>
        <div className="auth-orb auth-orb-2"></div>
        <div className="auth-orb auth-orb-3"></div>
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
            <h2>
              Join the <span>weaving community</span>
            </h2>
            <p>
              Whether you're a connoisseur of fine silk or a craftsman sharing your
              legacy, your journey with authentic handloom starts here.
            </p>
          </div>

          <ul className="auth-benefits">
            {benefits.map((b) => (
              <li key={b.text}>
                <span className="benefit-icon">{b.icon}</span>
                {b.text}
              </li>
            ))}
          </ul>

          <p className="auth-quote">
            "Every loom tells a story. Join us to write the next chapter."
          </p>
        </aside>

        <div className="auth-card">
          <div className="auth-card-header">
            <h1 id="register-title">Create Account</h1>
            <p>
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </div>

          {success && (
            <div className="success-banner" role="status">
              <IconCheck />
              Registration successful! Redirecting to your account...
            </div>
          )}

          {formError && (
            <div className="notice-banner error-banner" role="alert">
              <IconAlert size={16} />
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="register-name">Full Name</label>
              <div className="input-wrapper">
                <span className="input-icon"><IconUser /></span>
                <input
                  id="register-name"
                  type="text"
                  className={`form-input ${errors.name ? 'error' : ''}`}
                  placeholder="e.g. Aarav Mehta"
                  value={form.name}
                  autoComplete="name"
                  onChange={update('name')}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'register-name-error' : undefined}
                />
              </div>
              {errors.name && <FieldError id="register-name-error" message={errors.name} />}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="register-email">Email Address</label>
              <div className="input-wrapper">
                <span className="input-icon"><IconMail /></span>
                <input
                  id="register-email"
                  type="email"
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="you@example.com"
                  value={form.email}
                  autoComplete="email"
                  onChange={update('email')}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'register-email-error' : undefined}
                />
              </div>
              {errors.email && <FieldError id="register-email-error" message={errors.email} />}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="register-phone">Phone (optional)</label>
              <div className="input-wrapper">
                <span className="input-icon"><IconPhone /></span>
                <input
                  id="register-phone"
                  type="tel"
                  className={`form-input ${errors.phone ? 'error' : ''}`}
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  autoComplete="tel"
                  onChange={update('phone')}
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? 'register-phone-error' : undefined}
                />
              </div>
              {errors.phone && <FieldError id="register-phone-error" message={errors.phone} />}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="register-password">Password</label>
              <div className="input-wrapper has-toggle">
                <span className="input-icon"><IconLock /></span>
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  className={`form-input ${errors.password ? 'error' : ''}`}
                  placeholder="Min. 6 characters, letters & numbers"
                  value={form.password}
                  autoComplete="new-password"
                  onChange={update('password')}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'register-password-error' : undefined}
                />
                <button
                  type="button"
                  className="toggle-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
              {errors.password && <FieldError id="register-password-error" message={errors.password} />}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="register-confirm">Confirm Password</label>
              <div className="input-wrapper has-toggle">
                <span className="input-icon"><IconLock /></span>
                <input
                  id="register-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                  placeholder="Re-enter your password"
                  value={form.confirmPassword}
                  autoComplete="new-password"
                  onChange={update('confirmPassword')}
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={errors.confirmPassword ? 'register-confirm-error' : undefined}
                />
                <button
                  type="button"
                  className="toggle-btn"
                  onClick={() => setShowConfirm((prev) => !prev)}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
              {errors.confirmPassword && <FieldError id="register-confirm-error" message={errors.confirmPassword} />}
            </div>

            <div className="form-group">
              <label className="checkbox-label" htmlFor="register-terms">
                <input
                  id="register-terms"
                  type="checkbox"
                  checked={form.terms}
                  onChange={update('terms')}
                  aria-invalid={!!errors.terms}
                  aria-describedby={errors.terms ? 'register-terms-error' : undefined}
                />
                <span>
                  I agree to the <a href="#footer" className="forgot-link">Terms of Service</a> and{' '}
                  <a href="#footer" className="forgot-link">Privacy Policy</a>
                </span>
              </label>
              {errors.terms && <FieldError id="register-terms-error" message={errors.terms} />}
            </div>

            <button type="submit" className="auth-btn" disabled={submitting}>
              <span>{submitting ? 'Creating account…' : 'Create Account'}</span>
              {submitting ? <span className="auth-btn-spinner" aria-hidden="true"></span> : <IconArrowRight />}
            </button>
          </form>

          <div className="auth-switch">
            Already registered? <Link to="/login">Sign in instead</Link>
          </div>

          <Link to="/" className="auth-home-link">
            <IconArrowLeft size={16} />
            Back to home
          </Link>
        </div>
      </div>
    </section>
  )
}

export default Register