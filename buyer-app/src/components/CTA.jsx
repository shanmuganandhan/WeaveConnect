import './CTA.css'

function CTA() {
  return (
    <section id="cta" className="cta" aria-labelledby="cta-title">
      <div className="cta-bg">
        <div className="cta-gradient"></div>
        <div className="cta-pattern"></div>
        <div className="cta-orb orb-1"></div>
        <div className="cta-orb orb-2"></div>
      </div>
      <div className="container">
        <div className="cta-content">
          <div className="cta-badge">Limited Time Offer</div>
          <h2 id="cta-title" className="cta-title">
            Ready to Own a Piece of <span className="cta-highlight">Living Heritage</span>?
          </h2>
          <p className="cta-description">
            Join thousands of discerning customers who've discovered the joy of authentic, 
            handwoven silk sarees. Your perfect saree is waiting.
          </p>
          
          <div className="cta-offers">
            <div className="offer-item">
              <div className="offer-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              </div>
              <div className="offer-content">
                <span className="offer-title">Free Global Shipping</span>
                <span className="offer-desc">On orders over ₹15,000</span>
              </div>
            </div>
            <div className="offer-item">
              <div className="offer-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </div>
              <div className="offer-content">
                <span className="offer-title">30-Day Returns</span>
                <span className="offer-desc">Hassle-free exchanges</span>
              </div>
            </div>
            <div className="offer-item">
              <div className="offer-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div className="offer-content">
                <span className="offer-title">Authenticity Certificate</span>
                <span className="offer-desc">With every purchase</span>
              </div>
            </div>
          </div>
          
          <div className="cta-actions">
            <a href="#featured" className="btn btn-gold btn-large">
              <span>Start Your Journey</span>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>
            <a href="#story" className="btn btn-outline-light btn-large">
              <span>Learn Our Story</span>
            </a>
          </div>
          
          <div className="cta-trust">
            <p className="cta-trust-text">Trusted by 10,000+ customers across 50+ countries</p>
            <div className="cta-logos" aria-label="Featured in">
              <span className="logo-placeholder">Vogue India</span>
              <span className="logo-placeholder">Elle Decor</span>
              <span className="logo-placeholder">Conde Nast Traveller</span>
              <span className="logo-placeholder">Harper's Bazaar</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CTA