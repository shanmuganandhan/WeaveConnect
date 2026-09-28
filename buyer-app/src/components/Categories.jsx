import { Link } from 'react-router-dom'
import './Categories.css'

const categories = [
  {
    id: 1,
    name: 'Kanchipuram Silk',
    description: 'Temple borders & traditional motifs',
    count: '120+ Designs',
    image: 'https://images.unsplash.com/photo-1610033311645-5c61f4b6a2d4?w=500&q=80',
    region: 'Tamil Nadu',
    color: '#d4af37'
  },
  {
    id: 2,
    name: 'Banarasi Silk',
    description: 'Gold brocade & Mughal patterns',
    count: '95+ Designs',
    image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=500&q=80',
    region: 'Uttar Pradesh',
    color: '#b4825a'
  },
  {
    id: 3,
    name: 'Mysore Silk',
    description: 'Pure silk with gold zari',
    count: '78+ Designs',
    image: 'https://images.unsplash.com/photo-1595294359586-6a9ae26853e6?w=500&q=80',
    region: 'Karnataka',
    color: '#c9a84c'
  },
  {
    id: 4,
    name: 'Patola Silk',
    description: 'Double ikat geometric patterns',
    count: '45+ Designs',
    image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=500&q=80',
    region: 'Gujarat',
    color: '#a67c3d'
  },
  {
    id: 5,
    name: 'Pochampally Ikat',
    description: 'Tie-dye patterns on silk',
    count: '62+ Designs',
    image: 'https://images.unsplash.com/photo-1551488859-952a8583560a?w=500&q=80',
    region: 'Telangana',
    color: '#8b6f47'
  },
  {
    id: 6,
    name: 'Paithani Silk',
    description: 'Peacock motifs & pure gold zari',
    count: '38+ Designs',
    image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=500&q=80',
    region: 'Maharashtra',
    color: '#9c7a3e'
  }
]

const pointPositions = [
  { top: 30, left: 22 },
  { top: 18, left: 45 },
  { top: 55, left: 34 },
  { top: 70, left: 20 },
  { top: 62, left: 52 },
  { top: 42, left: 40 },
]

function Categories() {
  return (
    <section id="categories" className="categories" aria-labelledby="categories-title">
      <div className="container">
        <div className="section-header">
          <span className="section-badge">Shop by Region</span>
          <h2 id="categories-title" className="section-title">
            Explore <span className="section-highlight">Silk Categories</span>
          </h2>
          <p className="section-description">
            Journey through India's rich weaving heritage. Each region offers unique 
            techniques, patterns, and stories woven into every thread.
          </p>
        </div>
        
        <div className="categories-grid" role="list">
          {categories.map((category, index) => (
            <article key={category.id} className="category-card" role="listitem" style={{ '--index': index, '--category-color': category.color }}>
              <div className="category-image-wrapper">
                <img 
                  src={category.image} 
                  alt={`${category.name} silk saree collection`}
                  className="category-image"
                  loading="lazy"
                />
                <div className="category-gradient"></div>
                <div className="category-badge">
                  <span>{category.count}</span>
                </div>
              </div>
              <div className="category-content">
                <div className="category-meta">
                  <span className="category-region">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    {category.region}
                  </span>
                </div>
                <h3 className="category-name">{category.name}</h3>
                <p className="category-description">{category.description}</p>
                <Link to={`/products?category=${category.name.split(' ')[0]}`} className="category-link">
                  <span>Explore Collection</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
      
      <Link to="/products" className="categories-map" aria-label="Browse all silk saree categories">
        <div className="map-points" aria-hidden="true">
          {categories.map((cat, i) => (
            <span
              key={cat.id}
              className="map-point"
              style={{
                '--point-color': cat.color,
                top: `${pointPositions[i % pointPositions.length].top}%`,
                left: `${pointPositions[i % pointPositions.length].left}%`,
              }}
            >
              <span className="point-pulse"></span>
              <span className="point-core"></span>
              <span className="point-tooltip">
                <strong>{cat.name}</strong>
                <span>{cat.region}</span>
              </span>
            </span>
          ))}
        </div>
      </Link>
    </section>
  )
}

export default Categories