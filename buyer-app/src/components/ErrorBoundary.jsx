import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0f0d0a',
            color: '#fdf8f3',
            fontFamily: 'Georgia, serif',
            textAlign: 'center',
            padding: '24px',
          }}
        >
          <div style={{ fontSize: '2.6rem', marginBottom: 16 }} role="presentation">⚠</div>
          <h1 style={{ fontSize: '1.4rem', margin: '0 0 8px' }}>Something went wrong</h1>
          <p style={{ color: '#9c8a6b', margin: '0 0 20px' }}>
            An unexpected error occurred while rendering this page.
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false })
              window.location.assign('/')
            }}
            style={{
              padding: '12px 32px',
              border: 'none',
              borderRadius: 10,
              background: 'linear-gradient(135deg, #d4af37, #b4825a)',
              color: '#1a1612',
              fontSize: '0.95rem',
              fontWeight: 700,
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}
          >
            Back to Home
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
