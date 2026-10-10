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
