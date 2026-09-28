import './Stars.css'

export default function Stars({ rating, size = 14, reviewsText, className = '', valueClassName = 'ui-stars-value', countClassName = 'ui-stars-count' }) {
  return (
    <div className={`ui-stars ${className}`} aria-label={`Rated ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          aria-hidden="true"
          key={i}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={rating >= i ? '#d4af37' : 'none'}
          stroke="#d4af37"
          strokeWidth="2"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
      <span className={valueClassName}>{rating.toFixed(1)}</span>
      {reviewsText && <span className={countClassName}>{reviewsText}</span>}
    </div>
  )
}
