import './WhyChoose.css'

const features = [
  {
    id: 1,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    title: 'Authenticity Guaranteed',
    description: 'Every saree comes with a certificate of authenticity, verifying its origin, weaving technique, and artisan credentials.',
    number: '01'
  },
  {
    id: 2,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      </svg>
    ),
    title: 'Direct from Weavers',
    description: 'We work directly with master artisans, eliminating middlemen. This ensures fair wages for weavers and best prices for you.',
    number: '02'
  },
  {
    id: 3,
    icon: (
      <svg width="28" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 6v6l4 2"/>
      </svg>
    ),
    title: 'Timeless Quality',
    description: 'Each piece undergoes 27-point quality inspection. Our sarees are crafted to be heirlooms, lasting generations with proper care.',
    number: '03'
  },
  {
    id: 4,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>
    ),
    title: 'Free Global Shipping',
    description: 'Complimentary insured shipping worldwide. Each saree is packaged in premium presentation boxes with care instructions.',
    number: '04'
  },
  {
    id: 5,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
      </svg>
    ),
    title: 'Easy Returns & Exchange',
    description: '30-day hassle-free returns. Not satisfied? We offer free pickup and full refund or exchange. Your joy is our priority.',
    number: '05'
  },
  {
    id: 6,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: 'Personal Styling Help',
    description: 'Our textile experts offer complimentary virtual consultations to help you choose the perfect saree for any occasion.',
    number: '06'
  }
]

function WhyChoose() {
  return (
    <section id="why-choose" className="why-choose" aria-labelledby="why-choose-title">
      <div className="why-choose-bg">
        <div className="bg-orb orb-1"></div>
        <div className="bg-orb orb-2"></div>
        <div className="bg-orb orb-3"></div>
      </div>
      <div className="container">
        <div className="section-header">
          <span className="section-badge">Our Promise</span>
          <h2 id="why-choose-title" className="section-title">
            Why Choose <span className="section-highlight">WeaveConnect</span>
          </h2>
          <p className="section-description">
            We bridge the gap between master weavers and discerning customers worldwide, 
            preserving heritage while delivering an exceptional experience.
          </p>
        </div>
        
        <div className="features-grid" role="list">
          {features.map((feature, index) => (
            <article key={feature.id} className="feature-card" role="listitem" style={{ '--index': index }}>
              <div className="feature-number">{feature.number}</div>
              <div className="feature-icon">
                {feature.icon}
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
              <div className="feature-border"></div>
            </article>
          ))}
        </div>
        
        <div className="trust-indicators">
          <div className="trust-item">
            <div className="trust-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div className="trust-content">
              <span className="trust-value">500+</span>
              <span className="trust-label">Master Weavers</span>
            </div>
          </div>
          <div className="trust-item">
            <div className="trust-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <div className="trust-content">
              <span className="trust-value">98%</span>
              <span className="trust-label">Customer Satisfaction</span>
            </div>
          </div>
          <div className="trust-item">
            <div className="trust-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            </div>
            <div className="trust-content">
              <span className="trust-value">24/7</span>
              <span className="trust-label">Expert Support</span>
            </div>
          </div>
          <div className="trust-item">
            <div className="trust-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            </div>
            <div className="trust-content">
              <span className="trust-value">50+</span>
              <span className="trust-label">Countries Served</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default WhyChoose
