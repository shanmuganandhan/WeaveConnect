import './Toast.css'

export default function Toast({ toast }) {
  if (!toast) return null
  return (
    <div className={`ui-toast ${toast.type === 'error' ? 'error' : ''}`} role="status" aria-live="polite">
      <span className="ui-toast-icon" aria-hidden="true">
        {toast.type === 'error' ? '✕' : '✓'}
      </span>
      <span>{toast.message}</span>
    </div>
  )
}
