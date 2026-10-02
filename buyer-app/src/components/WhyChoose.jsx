import './WhyChoose.css'

/**
 * Kept deliberately factual: every point below describes something the app
 * actually does, rather than a claim we cannot back up.
 */
const POINTS = [
  {
    id: 1,
    title: 'Direct from manufacturers',
    text: 'Each saree is listed by the registered manufacturer who weaves it, so you see the price and the available stock as it is on their record.',
  },
  {
    id: 2,
    title: 'Traditional craftsmanship',
    text: 'The collection is grouped by weave — Kanchipuram, Banarasi, Mysore, Patola, Pochampally and Paithani — so the craft behind each saree is clear.',
  },
  {
    id: 3,
    title: 'Authentic collections',
    text: 'Category, price, stock and product images all come from the same product record, so what you browse is what the weaver has listed.',
  },
  {
    id: 4,
    title: 'Easy ordering',
    text: 'Add to cart, set the quantity, add your delivery address and place the order. Payment is cash on delivery.',
  },
]

function WhyChoose() {
  return (
    <section id="why-choose" className="why-choose" aria-labelledby="why-choose-title">
      <div className="container">
        <div className="section-header">
          <span className="section-badge">Why WeaveConnect</span>
          <h2 id="why-choose-title" className="section-title">
            A simple way to buy <span className="section-highlight">handloom silk</span>
          </h2>
          <p className="section-description">
            WeaveConnect keeps the buying journey short: browse by weave, check the
            stock, and order the saree you want.
          </p>
        </div>

        <div className="why-grid" role="list">
          {POINTS.map((point) => (
            <article key={point.id} className="why-card" role="listitem">
              <span className="why-number">{String(point.id).padStart(2, '0')}</span>
              <h3 className="why-title">{point.title}</h3>
              <p className="why-text">{point.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default WhyChoose
