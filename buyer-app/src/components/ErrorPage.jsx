import { Link } from 'react-router-dom'

export default function ErrorPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', fontFamily: 'var(--sans)' }}>
      <h1 style={{ fontSize: 'clamp(4rem, 10vw, 6rem)', fontWeight: 700, color: '#d4af37', margin: 0 }}>404</h1>
      <p style={{ fontSize: '1.05rem', color: '#7a6a58', margin: '0.5rem 0 1.75rem', textAlign: 'center', padding: '0 1rem' }}>
        We could not find the page you are looking for.
      </p>
      <Link to="/" style={{ padding: '0.75rem 1.75rem', background: '#d4af37', color: '#fff', borderRadius: 999, textDecoration: 'none', fontWeight: 700 }}>
        Back to home
      </Link>
    </div>
  )
}
