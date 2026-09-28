import './Skeleton.css'

export function Skeleton({ className = '', style }) {
  return <div className={`skeleton ${className}`} style={style} aria-hidden="true" />
}

export function SkeletonText({ lines = 1, width }) {
  return (
    <div className="skeleton-text" aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className="skeleton skeleton-line"
          style={width && i === lines - 1 ? { width } : undefined}
        />
      ))}
    </div>
  )
}

export function SkeletonCard({ footer = false }) {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <Skeleton className="skeleton-image" />
      <div className="skeleton-card-body">
        <Skeleton className="skeleton-chip" />
        <SkeletonText lines={2} width="60%" />
        {footer && <Skeleton className="skeleton-price" />}
      </div>
    </div>
  )
}

export function SkeletonGrid({ count = 4, footer = false, className = '' }) {
  return (
    <div className={`skeleton-grid ${className}`} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} footer={footer} />
      ))}
    </div>
  )
}
