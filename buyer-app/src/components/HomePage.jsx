import Hero from './Hero'
import Categories from './Categories'
import FeaturedSarees from './FeaturedSarees'
import WhyChoose from './WhyChoose'
import CTA from './CTA'

// The Navbar and Footer come from PublicLayout now, so this component only
// owns the page sections.
export default function HomePage() {
  return (
    <>
      <Hero />
      <Categories />
      <FeaturedSarees />
      <WhyChoose />
      <CTA />
    </>
  )
}
