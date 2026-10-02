import { Link } from 'react-router-dom'
import './Hero.css'

const POINTS = [
  'Listed by the manufacturer who weaves them',
  'Cash on delivery across India',
  'Browse by weave: Kanchipuram, Banarasi, Patola and more',
]

function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-inner">
        <div className="hero-copy">
          <span className="hero-badge">WeaveConnect · Traditional Silk Marketplace</span>

          <h1 id="hero-title" className="hero-title">
            Discover Authentic Silk Sarees
            <span className="hero-title-accent">Directly From the Weavers</span>
          </h1>

          <p className="hero-text">
            WeaveConnect connects buyers with the manufacturers who actually weave
            traditional silk sarees. Browse each weave by category, check live
            availability, and order the saree you want — the order goes straight
            to the maker.
          </p>

          <div className="hero-actions">
            <a href="#featured" className="hero-btn hero-btn-primary">
              Explore Collection
            </a>
            <Link to="/products" className="hero-btn hero-btn-ghost">
              Shop Now
            </Link>
          </div>

          <ul className="hero-points">
            {POINTS.map((point) => (
              <li key={point}>
                <span className="hero-point-check" aria-hidden="true">✓</span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div className="hero-art">
          <div className="hero-image-frame">
            <img
              src="/images/hero-bridal.jpg"
              alt="A handwoven silk saree draped on a mannequin"
              className="hero-image"
              loading="eager"
            />
          </div>
          <div className="hero-weave-tag">
            <span className="hero-weave-tag-label">Handloom weaves</span>
            <span className="hero-weave-tag-value">Kanchipuram · Banarasi · Mysore · Patola · Pochampally · Paithani</span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
