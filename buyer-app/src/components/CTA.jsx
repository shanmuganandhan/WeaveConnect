import { Link } from 'react-router-dom'
import { IconArrowRight } from './ui/Icons'
import './CTA.css'

function CTA() {
  return (
    <section id="cta" className="cta" aria-labelledby="cta-title">
      <div className="container">
        <div className="cta-card">
          <div className="cta-copy">
            <span className="cta-badge">Start shopping</span>
            <h2 id="cta-title" className="cta-title">
              Your next saree is one weave away
            </h2>
            <p className="cta-text">
              Sign in to save your cart, place an order and follow it from pending to
              delivered. New to WeaveConnect? Creating an account takes a minute.
            </p>
          </div>
          <div className="cta-actions">
            <Link to="/products" className="cta-btn cta-btn-primary">
              Browse the collection
              <IconArrowRight size={18} />
            </Link>
            <Link to="/register" className="cta-btn cta-btn-ghost">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CTA
