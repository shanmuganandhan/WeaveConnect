import './PhotoCountBadge.css'

export function PhotoCountBadge({ count, className = '' }) {
  if (!count || count <= 1) return null
  return (
    <span className={`photo-count-badge ${className}`} aria-label={`${count} photos`}>
      <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
      <span className="photo-count-text">{count} photos</span>
    </span>
  )
}