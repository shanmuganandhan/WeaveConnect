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