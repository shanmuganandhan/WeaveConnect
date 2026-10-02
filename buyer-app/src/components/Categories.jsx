import { Link } from 'react-router-dom'
import { CATEGORIES } from '../utils/product'
import './Categories.css'

/**
 * The names below are the exact `category` values stored on products by the
 * backend, so every card links straight to a working filtered result.
 * Images come from the files already shipped in /public/images.
 */
const CATEGORY_DETAILS = {
  Kanchipuram: {
    region: 'Tamil Nadu',
    blurb: 'Temple borders and contrast borders woven in silk and zari.',
    image: '/images/category-kanchipuram.jpg',
  },
  Banarasi: {
    region: 'Uttar Pradesh',
    blurb: 'Brocade sarees with Mughal inspired floral and paisley motifs.',
    image: '/images/category-banarasi.jpg',
  },
  Mysore: {
    region: 'Karnataka',
    blurb: 'Soft mulberry silk sarees with a light, elegant drape.',
    image: '/images/category-mysore.jpg',
  },
  Patola: {
    region: 'Gujarat',
    blurb: 'Double ikat weaves with geometric patterns in silk.',
    image: '/images/category-sariborder.jpg',
  },
  Pochampally: {
    region: 'Telangana',
    blurb: 'Ikat tie-dye cotton-silk sarees with a rustic finish.',
    image: '/images/category-pochampally.jpg',
  },
  Paithani: {
    region: 'Maharashtra',
    blurb: 'Peacock and tapestry motifs worked in gold zari.',
    image: '/images/category-paithani.jpg',
  },
}

function Categories() {
  return (
    <section id="categories" className="categories" aria-labelledby="categories-title">
      <div className="container">
        <div className="section-header">
          <span className="section-badge">Shop by weave</span>
          <h2 id="categories-title" className="section-title">
            Silk Saree <span className="section-highlight">Categories</span>
          </h2>
          <p className="section-description">
            Every saree on WeaveConnect is listed under the weave it belongs to.
            Pick a category to see what is available right now.
          </p>
        </div>

        <div className="categories-grid" role="list">
          {CATEGORIES.map((name) => {
            const detail = CATEGORY_DETAILS[name]
            return (
              <Link
                key={name}
                to={`/products?category=${encodeURIComponent(name)}`}
                className="category-card"
                role="listitem"
              >
                <div className="category-image">
                  <img src={detail.image} alt={`${name} silk sarees`} loading="lazy" />
                </div>
                <div className="category-body">
                  <span className="category-region">{detail.region}</span>
                  <h3 className="category-name">{name}</h3>
                  <p className="category-blurb">{detail.blurb}</p>
                  <span className="category-cta">
                    View {name}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default Categories
