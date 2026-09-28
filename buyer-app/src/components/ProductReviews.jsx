import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  getProductReviews,
  getReviewEligibility,
  getMyReview,
  createReview,
  updateReview,
  deleteReview,
} from '../api/reviews'
import { useAuth } from '../context/AuthContext'
import { formatDate } from '../utils/date'
import Stars from './ui/Stars'
import Toast from './ui/Toast'
import { useToast } from '../hooks/useToast'
import { IconAlert, IconCheck, IconTrash, IconEdit } from './ui/Icons'
import './ProductReviews.css'

const RATING_WORDS = ['', 'Poor', 'Not great', 'Good', 'Very good', 'Excellent']

// Clickable 1-5 star row used inside the review form.
function StarPicker({ value, onChange, disabled }) {
  const [hover, setHover] = useState(0)
  const shown = hover || value

  return (
    <div className="rv-picker" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          className="rv-picker-star"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHover(i)}
          disabled={disabled}
          aria-label={`${i} star${i > 1 ? 's' : ''}`}
          aria-pressed={value === i}
        >
          <svg
            aria-hidden="true"
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill={shown >= i ? '#d4af37' : 'none'}
            stroke="#d4af37"
            strokeWidth="1.8"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>
      ))}
      <span className="rv-picker-word">{RATING_WORDS[shown] || 'Tap to rate'}</span>
    </div>
  )
}

function ProductReviews({ productId }) {
  const { user } = useAuth()
  const { toast, showToast } = useToast()

  const [reviews, setReviews] = useState([])
  const [averageRating, setAverageRating] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)
  const [loading, setLoading] = useState(true)

  // null = we have not checked yet, false = not allowed to review
  const [eligibility, setEligibility] = useState(null)
  const [myReview, setMyReview] = useState(null)

  const [rating, setRating] = useState(0)
  const [text, setText] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [editing, setEditing] = useState(false)

  const isBuyer = user?.role === 'buyer'

  const loadReviews = useCallback(async () => {
    try {
      const res = await getProductReviews(productId)
      setReviews(res.data.reviews || [])
      setAverageRating(res.data.averageRating || 0)
      setTotalReviews(res.data.totalReviews || 0)
    } catch {
      setReviews([])
    } finally {
      setLoading(false)
    }
  }, [productId])

  // Reviews are public, so they load for guests too.
  useEffect(() => {
    setLoading(true)
    setMyReview(null)
    setEligibility(null)
    setEditing(false)
    setRating(0)
    setText('')
    setFormError('')
    loadReviews()
  }, [productId, loadReviews])

  // Only a signed-in buyer needs the extra "am I allowed to review?" check.
  useEffect(() => {
    if (!isBuyer) return
    let active = true

    async function loadBuyerReviewState() {
      try {
        const elig = await getReviewEligibility(productId)
        if (!active) return
        setEligibility(elig.data)

        if (elig.data?.alreadyReviewed) {
          const mine = await getMyReview(productId)
          if (!active) return
          setMyReview(mine.data.review)
          setRating(mine.data.review.rating)
          setText(mine.data.review.text || '')
        }
      } catch {
        if (active) setEligibility(null)
      }
    }

    loadBuyerReviewState()

    return () => {
      active = false
    }
  }, [productId, isBuyer])

  const startEditing = () => {
    setEditing(true)
    setFormError('')
  }

  const cancelEditing = () => {
    setEditing(false)
    if (myReview) {
      setRating(myReview.rating)
      setText(myReview.text || '')
    }
    setFormError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')

    if (!rating) {
      setFormError('Please choose a rating from 1 to 5 stars.')
      return
    }

    setSubmitting(true)
    try {
      if (editing && myReview) {
        await updateReview(myReview._id, { rating, text })
        showToast('Your review has been updated')
      } else {
        await createReview(productId, { rating, text })
        showToast('Thank you! Your review has been submitted.')
      }
      setEditing(false)
      await loadReviews()
      const elig = await getReviewEligibility(productId)
      setEligibility(elig.data)
      const mine = await getMyReview(productId)
      setMyReview(mine.data.review)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!myReview) return
    setSubmitting(true)
    try {
      await deleteReview(myReview._id)
      showToast('Your review has been deleted')
      setMyReview(null)
      setRating(0)
      setText('')
      setEditing(false)
      await loadReviews()
      const elig = await getReviewEligibility(productId)
      setEligibility(elig.data)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="rv-section" aria-labelledby="rv-title">
      <div className="rv-header">
        <h2 id="rv-title">Customer Reviews</h2>
        {totalReviews > 0 ? (
          <div className="rv-summary">
            <Stars rating={averageRating} size={18} />
            <span className="rv-summary-count">
              {averageRating.toFixed(1)} · {totalReviews} review{totalReviews > 1 ? 's' : ''}
            </span>
          </div>
        ) : (
          <p className="rv-summary-empty">No reviews yet. Be the first to share your experience.</p>
        )}
      </div>

      {/* ---------- Write / edit a review ---------- */}
      {isBuyer && eligibility?.canReview && !myReview && (
        <form className="rv-form" onSubmit={handleSubmit} noValidate>
          <h3>Write a review</h3>
          <StarPicker value={rating} onChange={setRating} disabled={submitting} />
          <textarea
            className="rv-textarea"
            placeholder="Tell other buyers about the weave, the colour and the drape (optional)"
            value={text}
            maxLength={500}
            rows={4}
            onChange={(e) => setText(e.target.value)}
            disabled={submitting}
          />
          <div className="rv-form-foot">
            <span className="rv-char-count">{text.length}/500</span>
            <button type="submit" className="rv-submit" disabled={submitting || !rating}>
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      )}

      {isBuyer && myReview && !editing && (
        <div className="rv-mine">
          <div className="rv-mine-head">
            <span className="rv-mine-badge">
              <IconCheck size={14} /> Your Review
            </span>
            <span className="rv-mine-actions">
              <button type="button" className="rv-link-btn" onClick={startEditing} disabled={submitting}>
                <IconEdit size={14} /> Edit
              </button>
              <button type="button" className="rv-link-btn danger" onClick={handleDelete} disabled={submitting}>
                <IconTrash size={14} /> Delete
              </button>
            </span>
          </div>
          <Stars rating={myReview.rating} size={16} />
          {myReview.text && <p className="rv-mine-text">{myReview.text}</p>}
        </div>
      )}

      {isBuyer && myReview && editing && (
        <form className="rv-form" onSubmit={handleSubmit} noValidate>
          <h3>Edit your review</h3>
          <StarPicker value={rating} onChange={setRating} disabled={submitting} />
          <textarea
            className="rv-textarea"
            value={text}
            maxLength={500}
            rows={4}
            onChange={(e) => setText(e.target.value)}
            disabled={submitting}
          />
          <div className="rv-form-foot">
            <button type="button" className="rv-cancel" onClick={cancelEditing} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="rv-submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      {!user && (
        <p className="rv-notice">
          <Link to="/login">Log in</Link> to write a review for this saree.
        </p>
      )}

      {isBuyer && eligibility && !eligibility.canReview && !myReview && (
        <p className="rv-notice">
          {eligibility.purchased
            ? 'You have already reviewed this saree.'
            : 'Only buyers who have purchased this saree can leave a review.'}
        </p>
      )}

      {formError && (
        <div className="rv-error" role="alert">
          <IconAlert size={16} /> {formError}
        </div>
      )}

      {/* ---------- The list of reviews ---------- */}
      {loading ? (
        <p className="rv-notice">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="rv-notice">No reviews yet. Once buyers share their experience it will show up here.</p>
      ) : (
        <ul className="rv-list">
          {reviews.map((r) => (
            <li key={r._id} className="rv-item">
              <div className="rv-item-head">
                <span className="rv-item-name">{r.buyer?.name || 'Verified Buyer'}</span>
                <span className="rv-item-date">{formatDate(r.createdAt)}</span>
              </div>
              <Stars rating={r.rating} size={14} />
              {r.text && <p className="rv-item-text">{r.text}</p>}
            </li>
          ))}
        </ul>
      )}

      <Toast toast={toast} />
    </section>
  )
}

export default ProductReviews
