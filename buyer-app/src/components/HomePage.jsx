import Navbar from './Navbar'
import Hero from './Hero'
import FeaturedSarees from './FeaturedSarees'
import Categories from './Categories'
import WhyChoose from './WhyChoose'
import WeaversStory from './WeaversStory'
import Testimonials from './Testimonials'
import CTA from './CTA'
import Footer from './Footer'

export default function HomePage() {
  return (
    <>
      <Navbar />
      <Hero />
      <FeaturedSarees />
      <Categories />
      <WhyChoose />
      <WeaversStory />
      <Testimonials />
      <CTA />
      <Footer />
    </>
  )
}
