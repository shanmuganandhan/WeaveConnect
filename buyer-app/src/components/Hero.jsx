import './Hero.css'
import CountUp from './ui/CountUp'

function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-bg">
        <div className="hero-gradient"></div>
        <div className="hero-pattern"></div>
      </div>
      <div className="hero-content">
        <div className="hero-text">
          <span className="hero-badge">Handcrafted Excellence Since 1985</span>
          <h1 id="hero-title" className="hero-title">
            Discover the <span className="hero-highlight">Finest Silk Sarees</span> from India's Heritage Weavers
          </h1>
          <p className="hero-description">
            Experience the luxury of authentic handwoven silk sarees, crafted by master artisans 
            using centuries-old techniques. Each piece tells a story of tradition, artistry, and timeless elegance.
          </p>
          <div className="hero-actions">
            <a href="#featured" className="btn btn-primary">
              <span>Explore Collection</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>
            <a href="#story" className="btn btn-secondary">
              <span>Our Story</span>
            </a>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <CountUp value={500} className="stat-number" />
              <span className="stat-label">Master Weavers</span>
            </div>
            <div className="stat">
              <CountUp value={50} className="stat-number" />
              <span className="stat-label">Years of Legacy</span>
            </div>
            <div className="stat">
              <CountUp value={10000} className="stat-number" />
              <span className="stat-label">Happy Customers</span>
            </div>
            <div className="stat">
              <CountUp value={200} className="stat-number" />
              <span className="stat-label">Unique Designs</span>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-image-wrapper">
            <img 
              src="https://images.unsplash.com/photo-1610033311645-5c61f4b6a2d4?w=800&q=80" 
              alt="Beautiful silk saree draped elegantly"
              className="hero-main-image"
            />
            <div className="hero-accent-shapes">
              <div className="shape shape-1"></div>
              <div className="shape shape-2"></div>
              <div className="shape shape-3"></div>
            </div>
            <div className="hero-floating-cards">
              <div className="float-card card-1">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
                <span>Free Shipping</span>
              </div>
              <div className="float-card card-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <span>Authenticity Guaranteed</span>
              </div>
              <div className="float-card card-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                <span>Easy Returns</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="hero-scroll-indicator" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M19 12l-7 7-7-7"/>
        </svg>
      </div>
    </section>
  )
}

export default Hero