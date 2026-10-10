import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as authApi from '../api/auth'
import {
  IconMail,
  IconLock,
  IconEye,
  IconEyeOff,
  IconAlert,
  IconCheck,
  IconShield,
  IconArrowRight,
  IconArrowLeft,
} from './ui/Icons'
import './Auth.css'

// Resend cooldown (ms). The backend enforces the same 60s window, so this
// only saves the admin from firing a request that would be rejected.
const RESEND_COOLDOWN_MS = 60 * 1000

const STEP_LABELS = ['Email', 'Verify OTP', 'New password']

const PASSWORD_RULES =
  'Use at least 8 characters. Avoid your email address and obvious words like "password".'

/**
 * Three-step password recovery for admins, exactly as the backend expects it:
 *   1. ask for an OTP by email      -> POST /auth/forgot-password
 *   2. enter the 6-digit OTP        -> POST /auth/verify-otp   (returns resetToken)
 *   3. choose a new password        -> POST /auth/reset-password
 *
 * The resetToken only ever lives in this component's state, never in the URL,
 * so it cannot leak through browser history or a copied link.
 */
function ForgotPassword() {
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [resetToken, setResetToken] = useState(null)
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => () => clearInterval(timerRef.current), [])

  const startCooldown = () => {
    setCooldown(Math.ceil(RESEND_COOLDOWN_MS / 1000))
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const fail = (err) => {
    setFormError(err?.message || 'Something went wrong. Please try again.')
    setSubmitting(false)
  }

  // ---- Step 1: request the OTP -----------------------------------------
  const sendOtp = async (event) => {
    if (event) event.preventDefault()
    setFormError('')
    setNotice('')

    const value = email.trim()
    if (!value) {
      setFormError('Email is required.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setFormError('Please enter a valid email address.')
      return
    }
    if (submitting || cooldown > 0) return

    setSubmitting(true)
    try {
      await authApi.forgotPassword({ email: value })
      // The backend answers the same way whether or not the account exists,
      // so this wording is deliberate: it does not confirm anything.
      setNotice(`If an account exists for ${value}, a 6-digit code has been sent.`)
      setOtp('')
      setStep(1)
      startCooldown()
      setSubmitting(false)
    } catch (err) {
      fail(err)
    }
  }

  // ---- Step 2: verify the OTP ------------------------------------------
  const verifyOtp = async (event) => {
    event.preventDefault()
    setFormError('')

    const code = otp.trim()
    if (!/^\d{6}$/.test(code)) {
      setFormError('Enter the 6-digit code from your email.')
      return
    }
    if (submitting) return

    setSubmitting(true)
    try {
      const res = await authApi.verifyOtp({ email: email.trim(), otp: code })
      setResetToken(res?.data?.resetToken || null)
      setNewPassword('')
      setConfirmPassword('')
      setNotice('')
      setStep(2)
      setSubmitting(false)
    } catch (err) {
      fail(err)
    }
  }

  // ---- Step 3: set the new password ------------------------------------
  const resetPassword = async (event) => {
    event.preventDefault()
    setFormError('')

    if (newPassword.length < 8) {
      setFormError('Password must be at least 8 characters long.')
      return
    }
    if (newPassword !== confirmPassword) {
      setFormError('Passwords do not match.')
      return
    }
    if (submitting) return

    setSubmitting(true)
    try {
      await authApi.resetPassword({
        resetToken,
        newPassword,
        confirmPassword,
      })
      // The new password and the one-time reset token are dropped from
      // component state the moment the server confirms the change.
      setNewPassword('')
      setConfirmPassword('')
      setResetToken(null)
      setStep(3)
      setSubmitting(false)
    } catch (err) {
      fail(err)
    }
  }

  const backToEmail = () => {
    setFormError('')
    setNotice('')
    setOtp('')
    setResetToken(null)
    setStep(0)
  }

  return (
    <section className="auth-page" aria-labelledby="forgot-title">
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
              <path
                d="M16 6v20M8 10l8 2.5 8-2.5M8 16l8 2.5 8-2.5"
                stroke="#d4af37"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <span className="auth-brand-name">WeaveConnect Admin</span>
          </div>

          <div className="auth-brand-text">
            <h2>
              Reset your <span>admin password</span>
            </h2>
            <p>
              We email you a 6-digit code, you confirm it, then you choose a new
              password. Signing out everywhere is part of the reset, so any
              session someone else may hold stops working.
            </p>
          </div>

          <ul className="auth-benefits">
            <li>
              <span className="benefit-icon"><IconMail size={18} /></span>
              The code is valid for 10 minutes
            </li>
            <li>
              <span className="benefit-icon"><IconLock size={18} /></span>
              Each code can be used only once
            </li>
            <li>
              <span className="benefit-icon"><IconShield size={18} /></span>
              Every signed-in device is signed out after the reset
            </li>
          </ul>

          <p className="auth-quote">
            If you did not request this reset, you can ignore the email - nothing
            changes until a new password is saved.
          </p>
        </aside>

        <div className="auth-card">
          <div className="auth-card-header">
            <h1 id="forgot-title">Forgot Password</h1>
            <p>
              Remembered it? <Link to="/login">Back to sign in</Link>
            </p>
          </div>

          <ol className="otp-steps" aria-label="Password reset progress">
            {STEP_LABELS.map((label, index) => (
              <li key={label} className={index === step ? 'active' : ''} aria-current={index === step ? 'step' : undefined}>
                {label}
              </li>
            ))}
          </ol>

          {formError && (
            <div className="notice-banner error-banner" role="alert">
              <IconAlert size={16} />
              {formError}
            </div>
          )}

          {notice && !formError && (
            <div className="notice-banner" role="status">
              <IconMail size={16} />
              {notice}
            </div>
          )}

          {step === 0 && (
            <form onSubmit={sendOtp} noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="forgot-email">Admin Email</label>
                <div className="input-wrapper">
                  <span className="input-icon"><IconMail /></span>
                  <input
                    id="forgot-email"
                    type="email"
                    className="form-input"
                    placeholder="admin@weaveconnect.com"
                    value={email}
                    autoComplete="email"
                    autoFocus
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setFormError('')
                    }}
                  />
                </div>
              </div>

              <button type="submit" className="auth-btn" disabled={submitting || cooldown > 0}>
                <span>
                  {submitting
                    ? 'Sending code…'
                    : cooldown > 0
                      ? `Resend available in ${cooldown}s`
                      : 'Send OTP'}
                </span>
                {submitting ? (
                  <span className="auth-btn-spinner" aria-hidden="true"></span>
                ) : (
                  <IconArrowRight />
                )}
              </button>
            </form>
          )}

          {step === 1 && (
            <form onSubmit={verifyOtp} noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="forgot-otp">Enter the 6-digit code</label>
                <div className="input-wrapper">
                  <span className="input-icon"><IconLock /></span>
                  <input
                    id="forgot-otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    className="form-input otp-input"
                    placeholder="000000"
                    value={otp}
                    maxLength={6}
                    autoFocus
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                      setFormError('')
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="auth-btn"
                disabled={submitting || otp.length !== 6}
              >
                <span>{submitting ? 'Verifying…' : 'Verify OTP'}</span>
                {submitting ? (
                  <span className="auth-btn-spinner" aria-hidden="true"></span>
                ) : (
                  <IconArrowRight />
                )}
              </button>

              <div className="form-row" style={{ marginTop: '0.9rem', justifyContent: 'space-between' }}>
                <button
                  type="button"
                  className="forgot-link"
                  onClick={sendOtp}
                  disabled={cooldown > 0 || submitting}
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                </button>
                <button type="button" className="forgot-link" onClick={backToEmail} disabled={submitting}>
                  Change email
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={resetPassword} noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="new-password">New Password</label>
                <div className="input-wrapper has-toggle">
                  <span className="input-icon"><IconLock /></span>
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="At least 8 characters"
                    value={newPassword}
                    autoComplete="new-password"
                    autoFocus
                    onChange={(e) => {
                      setNewPassword(e.target.value)
                      setFormError('')
                    }}
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
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="confirm-password">Confirm New Password</label>
                <div className="input-wrapper">
                  <span className="input-icon"><IconLock /></span>
                  <input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Repeat the new password"
                    value={confirmPassword}
                    autoComplete="new-password"
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      setFormError('')
                    }}
                  />
                </div>
              </div>

              <p className="auth-hint">{PASSWORD_RULES}</p>

              <button
                type="submit"
                className="auth-btn"
                disabled={submitting || !newPassword || !confirmPassword}
              >
                <span>{submitting ? 'Saving…' : 'Reset Password'}</span>
                {submitting ? (
                  <span className="auth-btn-spinner" aria-hidden="true"></span>
                ) : (
                  <IconArrowRight />
                )}
              </button>
            </form>
          )}

          {step === 3 && (
            <div>
              <div className="success-banner" role="status">
                <IconCheck />
                Password updated successfully. Please sign in again.
              </div>
              <button
                type="button"
                className="auth-btn"
                onClick={() => navigate('/login', { replace: true })}
              >
                <span>Go to sign in</span>
                <IconArrowRight />
              </button>
            </div>
          )}

          {step < 3 && (
            <div className="auth-switch">
              Remembered your password? <Link to="/login">Sign in instead</Link>
            </div>
          )}

          <a
            href={`${import.meta.env.VITE_BUYER_APP_URL || 'http://localhost:3000'}`}
            className="auth-home-link"
          >
            <IconArrowLeft size={16} />
            Back to WeaveConnect
          </a>
        </div>
      </div>
    </section>
  )
}

export default ForgotPassword
