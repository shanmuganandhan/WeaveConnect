import { Link } from 'react-router-dom'
import './WeaversStory.css'
import CountUp from './ui/CountUp'

function WeaversStory() {
  return (
    <section id="story" className="weavers-story" aria-labelledby="story-title">
      <div className="story-bg"></div>
      <div className="container">
        <div className="story-layout">
          <div className="story-visual">
            <div className="story-image-wrapper">
              <img 
                src="https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800&q=80" 
                alt="Master weaver working on a traditional handloom"
                className="story-main-image"
              />
              <div className="story-accent">
                <div className="accent-shape shape-1"></div>
                <div className="accent-shape shape-2"></div>
                <div className="accent-shape shape-3"></div>
              </div>
              <div className="story-experience">
                <div className="exp-badge">
                  <span className="exp-years">50+</span>
                  <span className="exp-text">Years of Legacy</span>
                </div>
                <div className="exp-stats">
                  <div className="exp-stat">
                    <CountUp value={500} className="exp-number" />
                    <span className="exp-label">Weaver Families</span>
                  </div>
                  <div className="exp-divider"></div>
                  <div className="exp-stat">
                    <CountUp value={200} className="exp-number" />
                    <span className="exp-label">Villages Served</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="story-content">
            <div className="section-header">
              <span className="section-badge">Our Heritage</span>
              <h2 id="story-title" className="section-title">
                The <span className="section-highlight">Weavers' Story</span>
              </h2>
            </div>
            
            <div className="story-text">
              <p className="story-paragraph">
                In the heart of India's ancient weaving villages, the rhythmic <strong>clack-clack of handlooms</strong> 
                has echoed through generations. Each master weaver carries a legacy of techniques passed down from 
                father to son, mother to daughter—a living library of patterns, motifs, and secrets that no machine can replicate.
              </p>
              <p className="story-paragraph">
                At WeaveConnect, we don't just sell sarees. We <strong>honor the hands that weave them</strong>. 
                Every Kanchipuram border, every Banarasi brocade, every Patola ikat pattern represents months of 
                dedicated craftsmanship. A single saree can take 15 to 30 days to complete, with the weaver 
                tying thousands of tiny knots by hand to create intricate designs.
              </p>
              <p className="story-paragraph">
                Yet this heritage faces challenges. Younger generations migrate to cities, looms fall silent, 
                and traditional knowledge risks being lost forever. That's why we've made it our mission to 
                <strong>bring these masterpieces to the world</strong> while ensuring fair, sustainable livelihoods 
                for the artisans who create them.
              </p>
            </div>
            
            <div className="story-values">
              <div className="value-item">
                <div className="value-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </div>
                <div className="value-content">
                  <h4>Fair Trade Practices</h4>
                  <p>Weavers receive 60-70% of the retail price, compared to 10-15% in traditional supply chains.</p>
                </div>
              </div>
              <div className="value-item">
                <div className="value-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
                <div className="value-content">
                  <h4>Authenticity Preserved</h4>
                  <p>Every saree is certified with its origin, technique, and the artisan's signature.</p>
                </div>
              </div>
              <div className="value-item">
                <div className="value-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <div className="value-content">
                  <h4>Community Development</h4>
                  <p>We invest in healthcare, education, and infrastructure in weaving villages.</p>
                </div>
              </div>
            </div>
            
            <div className="story-cta">
              <Link to="/products" className="btn btn-primary">
                <span>Meet Our Weavers</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
              <a href="#footer" className="btn btn-outline">
                <span>View Impact Report</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default WeaversStory