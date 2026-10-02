import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth, homeRouteFor } from '../context/AuthContext'
import { IconUser, IconLock, IconEye, IconEyeOff, IconShield, IconCert, IconTruck, IconAlert, IconCheck, IconArrowRight, IconArrowLeft } from './ui/Icons'
import './Auth.css'

// Every line here describes something the app actually does - no claims about
// certificates, insurance or delivery promises that the backend does not back.
const benefits = [
  { icon: <IconShield size={18} />, text: 'Order directly from the registered manufacturers' },
  { icon: <IconCert size={18} />, text: 'Browse every saree by weave, with live stock shown' },
  { icon: <IconTruck size={18} />, text: 'Save your cart and follow each order from pending to delivered' },
]

// Only internal paths are allowed through, so a crafted ?returnTo= cannot push
// the shopper to another site after login.
const safeReturnTo = (value) =>
  typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : ''

function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnTo = safeReturnTo(searchParams.get('returnTo'))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(false)
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const validate = () => {
    const nextErrors = {}
    if (!email.trim()) {
      nextErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = 'Please enter a valid email address'
    }
    if (!password) {
      nextErrors.password = 'Password is required'
    } else if (password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters'
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
      const user = await login({ email: email.trim(), password, persist: rememberMe })
      setSuccess(true)
      setTimeout(() => {
        navigate(returnTo || homeRouteFor(user.role), { replace: true })
      }, 500)
    } catch (err) {
      setFormError(err.message)
      if (err.fieldErrors) {
        setErrors((prev) => ({ ...prev, ...err.fieldErrors }))
      }
      setSubmitting(false)
    }
  }

  const handleClearError = (field) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  return (
    <section className="auth-page" aria-labelledby="login-title">
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
              Welcome back to <span>the weavers' storefront</span>
            </h2>
            <p>
              Sign in to keep your cart, place an order and follow it through to
              delivery - the order goes straight to the manufacturer who wove it.
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
            WeaveConnect connects buyers with the manufacturers who weave the
            sarees they list.
          </p>
        </aside>

        <div className="auth-card">
          <div className="auth-card-header">
            <h1 id="login-title">Sign In</h1>
            <p>
              New to WeaveConnect? <Link to="/register">Create an account</Link>
            </p>
          </div>

          {returnTo && (
            <div className="notice-banner" role="status">
              <IconAlert size={16} />
              Please sign in to continue. We will take you back afterwards.
            </div>
          )}

          {formError && (
            <div className="notice-banner error-banner" role="alert">
              <IconAlert size={16} />
              {formError}
            </div>
          )}

          {success && (
            <div className="success-banner" role="status">
              <IconCheck />
              Login successful! Redirecting to your account...
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email Address</label>
              <div className="input-wrapper">
                <span className="input-icon"><IconUser /></span>
                <input
                  id="login-email"
                  type="email"
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="you@example.com"
                  value={email}
                  autoComplete="email"
                  onChange={(e) => {
                    setEmail(e.target.value)
                    handleClearError('email')
                  }}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'login-email-error' : undefined}
                />
              </div>
              {errors.email && (
                <p className="field-error" id="login-email-error">
                  <IconAlert size={14} />
                  {errors.email}
                </p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Password</label>
              <div className="input-wrapper has-toggle">
                <span className="input-icon"><IconLock /></span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className={`form-input ${errors.password ? 'error' : ''}`}
                  placeholder="Enter your password"
                  value={password}
                  autoComplete="current-password"
                  onChange={(e) => {
                    setPassword(e.target.value)
                    handleClearError('password')
                  }}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'login-password-error' : undefined}
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
              {errors.password && (
                <p className="field-error" id="login-password-error">
                  <IconAlert size={14} />
                  {errors.password}
                </p>
              )}
            </div>

            <div className="form-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember me
              </label>
            </div>

            <button type="submit" className="auth-btn" disabled={submitting}>
              <span>{submitting ? 'Signing in…' : 'Sign In'}</span>
              {submitting ? <span className="auth-btn-spinner" aria-hidden="true"></span> : <IconArrowRight />}
            </button>
          </form>

          <div className="auth-switch">
            Don't have an account? <Link to="/register">Register now</Link>
          </div>

          <div className="auth-switch" style={{ marginTop: 8 }}>
            {import.meta.env.VITE_SELLER_APP_URL && (
              <a href={`${import.meta.env.VITE_SELLER_APP_URL}/seller/login`} className="forgot-link">
                Are you a seller? Sign in here
              </a>
            )}
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

export default Login