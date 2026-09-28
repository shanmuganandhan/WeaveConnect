import { useState, useEffect, useCallback, useRef } from 'react'
import './Testimonials.css'
import CountUp from './ui/CountUp'

const testimonials = [
  {
    id: 1,
    name: 'Priya Sharma',
    location: 'Mumbai, India',
    role: 'Bride-to-be',
    rating: 5,
    text: 'The Kanchipuram bridal saree I ordered exceeded all expectations. The zari work is exquisite, the silk feels luxurious, and the certificate of authenticity gave me complete confidence. My wedding day will be truly special thanks to WeaveConnect.',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80',
    saree: 'Kanchipuram Bridal Silk'
  },
  {
    id: 2,
    name: 'Sarah Mitchell',
    location: 'London, UK',
    role: 'Textile Collector',
    rating: 5,
    text: 'As someone who collects traditional textiles worldwide, I was impressed by the authenticity and quality. The Patola double ikat I received is a masterpiece—every geometric pattern perfectly aligned. The packaging and documentation were museum-quality.',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80',
    saree: 'Patola Double Ikat'
  },
  {
    id: 3,
    name: 'Anjali Reddy',
    location: 'Hyderabad, India',
    role: 'Corporate Professional',
    rating: 5,
    text: 'I\'ve purchased three sarees from WeaveConnect now, and each has been flawless. The Pochampally Ikat is my daily wear favorite—comfortable, vibrant, and gets compliments every time. Their styling consultation helped me choose the perfect pieces for my wardrobe.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
    saree: 'Pochampally Ikat Silk'
  },
  {
    id: 4,
    name: 'Meera Kapoor',
    location: 'New York, USA',
    role: 'Fashion Designer',
    rating: 5,
    text: 'The Banarasi Katan silk I ordered for my collection shoot was breathtaking. The gold brocade caught the light beautifully. What sets WeaveConnect apart is their transparency—you know exactly which weaver created your piece and the story behind it.',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80',
    saree: 'Banarasi Katan Silk'
  },
  {
    id: 5,
    name: 'Lakshmi Narayanan',
    location: 'Chennai, India',
    role: 'Grandmother of 3',
    rating: 5,
    text: 'I gifted Mysore Silk sarees to my three granddaughters for their graduations. The quality is heirloom-level—they\'ll last generations. The weaver\'s signature on the certificate made each gift deeply personal. Thank you for preserving our heritage.',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&q=80',
    saree: 'Mysore Silk Royale'
  },
  {
    id: 6,
    name: 'Emma Thompson',
    location: 'Sydney, Australia',
    role: 'Cultural Enthusiast',
    rating: 5,
    text: 'Living abroad, I worried about authenticity when buying Indian silk online. WeaveConnect\'s certification, detailed origin stories, and direct weaver connection eliminated all doubts. The Paithani saree arrived perfectly packaged with care instructions. Incredible service!',
    image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&q=80',
    saree: 'Paithani Silk Saree'
  }
]

function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [touchStart, setTouchStart] = useState(null)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const resumeTimerRef = useRef(null)

  const next = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % testimonials.length)
  }, [])

  const prev = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + testimonials.length) % testimonials.length)
  }, [])

  const goTo = useCallback((index) => {
    setCurrentIndex(index)
    setIsAutoPlaying(false)
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
    resumeTimerRef.current = setTimeout(() => setIsAutoPlaying(true), 5000)
  }, [])

  useEffect(() => () => clearTimeout(resumeTimerRef.current), [])

  useEffect(() => {
    if (!isAutoPlaying) return
    const interval = setInterval(next, 5000)
    return () => clearInterval(interval)
  }, [isAutoPlaying, next])

  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX)
  }

  const handleTouchMove = (e) => {
    if (touchStart === null) return
    const touchEnd = e.touches[0].clientX
    const diff = touchStart - touchEnd
    if (Math.abs(diff) > 50) {
      if (diff > 0) next()
      else prev()
      setTouchStart(null)
    }
  }

  const visibleTestimonials = testimonials.slice(currentIndex, currentIndex + 3).concat(
    testimonials.slice(0, Math.max(0, 3 - (testimonials.length - currentIndex)))
  )

  return (
    <section id="testimonials" className="testimonials" aria-labelledby="testimonials-title">
      <div className="testimonials-bg"></div>
      <div className="container">
        <div className="section-header">
          <span className="section-badge">Customer Stories</span>
          <h2 id="testimonials-title" className="section-title">
            Trusted by <span className="section-highlight">Thousands Worldwide</span>
          </h2>
          <p className="section-description">
            Real stories from customers who've experienced the WeaveConnect difference. 
            Their joy is our greatest achievement.
          </p>
        </div>

        <div className="testimonials-wrapper">
          <button 
            className="nav-btn nav-prev" 
            onClick={prev}
            aria-label="Previous testimonial"
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>

          <div 
            className="testimonials-track" 
            role="region" 
            aria-label="Customer testimonials carousel"
            aria-live="polite"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
          >
            {visibleTestimonials.map((testimonial, index) => (
              <article key={testimonial.id} className="testimonial-card" style={{ '--index': index }}>
                <div className="testimonial-rating" aria-label={`Rated ${testimonial.rating} out of 5`}>
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="star" aria-hidden="true">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  ))}
                </div>
                <blockquote className="testimonial-text">
                  &ldquo;{testimonial.text}&rdquo;
                </blockquote>
                <div className="testimonial-author">
                  <img 
                    src={testimonial.image} 
                    alt="" 
                    className="author-avatar"
                    loading="lazy"
                  />
                  <div className="author-info">
                    <cite className="author-name">{testimonial.name}</cite>
                    <div className="author-meta">
                      <span className="author-location">{testimonial.location}</span>
                      <span className="author-divider">·</span>
                      <span className="author-role">{testimonial.role}</span>
                    </div>
                  </div>
                </div>
                <div className="testimonial-saree">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  <span>Wore: {testimonial.saree}</span>
                </div>
              </article>
            ))}
          </div>

          <button 
            className="nav-btn nav-next" 
            onClick={next}
            aria-label="Next testimonial"
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>

        <div className="testimonials-dots" aria-label="Testimonial navigation">
          {testimonials.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goTo(index)}
              aria-label={`Go to testimonial ${index + 1}`}
              aria-current={index === currentIndex ? 'true' : undefined}
            />
          ))}
        </div>

        <div className="testimonials-stats">
          <div className="stat-item">
            <CountUp value={4987} className="stat-number" />
            <span className="stat-label">Happy Customers</span>
          </div>
          <div className="stat-item">
            <CountUp value={49} className="stat-number" />
            <span className="stat-label">Countries</span>
          </div>
          <div className="stat-item">
            <CountUp value={48} className="stat-number" />
            <span className="stat-label">Hours Avg. Response</span>
          </div>
          <div className="stat-item">
            <CountUp value={99} className="stat-number" />
            <span className="stat-label">% Satisfaction</span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Testimonials