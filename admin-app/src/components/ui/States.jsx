import { Link } from 'react-router-dom'
import './States.css'

export function EmptyState({ icon = '🗂', title = 'Nothing here yet', message, actionLabel, onAction, actionHref, action, compact = false }) {
  // Work out the action button first, so the compact layout can show it too.
  // (Previously the compact branch returned early and silently dropped both
  // the message and the action, so callers passing them got nothing clickable.)
  const label = action?.label || actionLabel
  const to = action?.to
  const onClick = action?.onClick || onAction
  const href = actionHref

  let actionEl = null
  if (label) {
    actionEl = to ? (
      <Link to={to} className="ui-empty-action">{label}</Link>
    ) : onClick ? (
      <button type="button" className="ui-empty-action" onClick={onClick}>{label}</button>
    ) : href ? (
      <a href={href} className="ui-empty-action">{label}</a>
    ) : null
  }

  if (compact) {
    return (
      <div className="ui-empty ui-empty-compact" role="status">
        <span className="ui-empty-compact-icon" aria-hidden="true">{icon}</span>
        <div className="ui-empty-compact-body">
          <span className="ui-empty-compact-title">{title}</span>
          {message && <span className="ui-empty-compact-message">{message}</span>}
        </div>
        {actionEl}
      </div>
    )
  }

  return (
    <div className="ui-empty" role="status">
      <div className="ui-empty-icon" aria-hidden="true">{icon}</div>
      <h3 className="ui-empty-title">{title}</h3>
      {message && <p className="ui-empty-message">{message}</p>}
      {actionEl}
    </div>
  )
}

export function ErrorState({ title = 'Something went wrong', message = 'Please try again in a moment.', onRetry, children }) {
  return (
    <div className="ui-error" role="alert">
      <div className="ui-error-icon" aria-hidden="true">⚠</div>
      <h3 className="ui-error-title">{title}</h3>
      {message && <p className="ui-error-message">{message}</p>}
      {children}
      {onRetry && (
        <button type="button" className="ui-error-action" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  )
}
