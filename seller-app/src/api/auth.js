import api from './client'

export async function login({ email, password }) {
  return await api.post('/auth/login', { email, password })
}

export async function register({ name, email, password, phone, role, ...sellerFields }) {
  return await api.post('/auth/register', {
    name,
    email,
    password,
    phone,
    role,
    ...sellerFields,
  })
}

// --- Forgot password (email OTP) ---
// Step 1: ask the backend to email an OTP to this address.
export async function forgotPassword({ email }) {
  return await api.post('/auth/forgot-password', { email })
}

// Step 2: check the OTP. On success the backend returns a resetToken.
export async function verifyOtp({ email, otp }) {
  return await api.post('/auth/verify-otp', { email, otp })
}

// Step 3: set the new password using the resetToken from step 2.
export async function resetPassword({ resetToken, newPassword, confirmPassword }) {
  return await api.post('/auth/reset-password', { resetToken, newPassword, confirmPassword })
}

// Signs out of THIS device. The refresh token in the body lets the server
// revoke the session even when the access token has already expired.
export async function logout({ refreshToken } = {}) {
  return await api.post('/auth/logout', { refreshToken })
}

// Signs out everywhere: revokes every session and bumps the session version
// so any token still in flight is dead too.
export async function logoutAll() {
  return await api.post('/auth/logout-all')
}
