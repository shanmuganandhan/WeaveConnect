import { Link } from 'react-router-dom'

export default function ErrorPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'var(--sans)' }}>
      <h1 style={{ fontSize: 72, fontWeight: 700, color: '#d4af37', margin: 0 }}>404</h1>
      <p style={{ fontSize: 18, color: '#6b7280', margin: '8px 0 24px' }}>Page not found</p>
      <a href={import.meta.env.VITE_BUYER_APP_URL || 'http://localhost:3000'} style={{ padding: '10px 24px', background: '#d4af37', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>
        Back to Home
      </a>
    </div>
  )
}
