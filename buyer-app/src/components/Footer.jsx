import { useState } from 'react'
import { Link } from 'react-router-dom'
import './Footer.css'

function Footer() {
  const currentYear = new Date().getFullYear()
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubscribe = (e) => {
    e.preventDefault()
    if (email.trim()) {
      setSubscribed(true)
      setEmail('')
      setTimeout(() => setSubscribed(false), 4000)
    }
  }
  
  return (
    <footer id="footer" className="footer" role="contentinfo">
      <div className="footer-bg"></div>
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-logo">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="logo-icon" aria-hidden="true">
                <path d="M16 2L4 6v20l12 4 12-4V6L16 2z" stroke="#d4af37" strokeWidth="2"/>
                <path d="M16 6v20M8 10l8 2.5 8-2.5M8 16l8 2.5 8-2.5" stroke="#d4af37" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span className="logo-text">WeaveConnect</span>
            </div>
            <p className="brand-description">
              Connecting you with India's finest handwoven silk sarees, 
              crafted by master artisans preserving centuries of weaving heritage.
            </p>
            <div className="social-links" aria-label="Social media links">
              <a href="https://instagram.com" className="social-link" aria-label="Instagram" target="_blank" rel="noreferrer">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </a>
              <a href="https://facebook.com" className="social-link" aria-label="Facebook" target="_blank" rel="noreferrer">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
              </a>
              <a href="https://twitter.com" className="social-link" aria-label="Twitter" target="_blank" rel="noreferrer">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
                </svg>
              </a>
              <a href="https://pinterest.com" className="social-link" aria-label="Pinterest" target="_blank" rel="noreferrer">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                  <path d="M5 17h14v-2.5a2.5 2.5 0 0 0-5 0V17z"/>
                  <path d="M7 17l-1-5h4l1 5H7z"/>
                  <path d="M12 2v20"/>
                  <path d="M17 17l1-5h-4l-1 5h4z"/>
                </svg>
              </a>
              <a href="https://youtube.com" className="social-link" aria-label="YouTube" target="_blank" rel="noreferrer">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.44 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.44 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17z"/>
                  <path d="M10 10l7 4-7 4v-8z"/>
                </svg>
              </a>
            </div>
          </div>
          
          <nav className="footer-nav" aria-label="Footer navigation">
            <h4 className="footer-heading">Shop</h4>
            <ul className="footer-links" role="list">
              <li><a href="#featured">Featured Sarees</a></li>
              <li><a href="#categories">All Categories</a></li>
              <li><Link to="/products?category=Kanchipuram">Kanchipuram Silk</Link></li>
              <li><Link to="/products?category=Banarasi">Banarasi Silk</Link></li>
              <li><Link to="/products?category=Mysore">Mysore Silk</Link></li>
              <li><Link to="/products?category=Patola">Patola Silk</Link></li>
              <li><Link to="/products?category=Pochampally">Pochampally Ikat</Link></li>
              <li><Link to="/products?category=Paithani">Paithani Silk</Link></li>
            </ul>
          </nav>
          
          <nav className="footer-nav" aria-label="Company information">
            <h4 className="footer-heading">Company</h4>
            <ul className="footer-links" role="list">
              <li><a href="#story">Our Story</a></li>
              <li><Link to="/products">Meet Our Weavers</Link></li>
              <li><a href="#footer">Impact Report</a></li>
              <li><a href="#footer">Careers</a></li>
              <li><a href="#footer">Press & Media</a></li>
              <li><a href="#footer">Sustainability</a></li>
              <li><a href="#footer">Blog</a></li>
            </ul>
          </nav>
          
          <nav className="footer-nav" aria-label="Customer support">
            <h4 className="footer-heading">Account</h4>
            <ul className="footer-links" role="list">
              <li><Link to="/login">Sign In</Link></li>
              <li><Link to="/register">Create Account</Link></li>
              <li><Link to="/login">Track Order</Link></li>
              <li><a href="#footer">FAQs</a></li>
              <li><a href="#footer">Contact Us</a></li>
              <li><a href="#footer">Returns & Exchanges</a></li>
            </ul>
          </nav>
          
          <div className="footer-contact">
            <h4 className="footer-heading">Connect With Us</h4>
            <div className="contact-info">
              <div className="contact-item">
                <div className="contact-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                </div>
                <div className="contact-details">
                  <span className="contact-label">Visit Our Studio</span>
                  <address className="contact-value">123 Silk Road, Kanchipuram, Tamil Nadu 631501, India</address>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                </div>
                <div className="contact-details">
                  <span className="contact-label">Call Us</span>
                  <a href="tel:+914412345678" className="contact-value">+91 44 1234 5678</a>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <div className="contact-details">
                  <span className="contact-label">Email Us</span>
                  <a href="mailto:hello@weaveconnect.com" className="contact-value">hello@weaveconnect.com</a>
                </div>
              </div>
            </div>
            
            <form className="newsletter-form" aria-label="Newsletter subscription" onSubmit={handleSubscribe}>
              <label htmlFor="email" className="visually-hidden">Email address</label>
              <input 
                type="email" 
                id="email" 
                name="email"
                placeholder="Enter your email" 
                className="newsletter-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit" className="newsletter-btn" aria-label="Subscribe">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
              <p className="newsletter-note" role="status" aria-live="polite">
                {subscribed ? 'Thanks for subscribing!' : 'Subscribe for exclusive offers & weaving stories'}
              </p>
            </form>
          </div>
        </div>
        
        <div className="footer-bottom">
          <div className="footer-divider"></div>
          <div className="footer-bottom-content">
            <p className="copyright">
              &copy; {currentYear} WeaveConnect. All rights reserved. 
              Crafted with <span className="heart" aria-label="love">♥</span> for heritage.
            </p>
            <nav className="footer-legal" aria-label="Legal links">
              <ul role="list">
                <li><a href="#footer">Privacy Policy</a></li>
                <li><a href="#footer">Terms of Service</a></li>
                <li><a href="#footer">Cookie Policy</a></li>
                <li><a href="#footer">Accessibility</a></li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer