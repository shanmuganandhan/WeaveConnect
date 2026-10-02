import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { ScrollToTop } from '../components/AppChrome'

/**
 * Chrome for every public storefront page (home, collection, product details,
 * seller store, 404). Before this existed those routes rendered with no header
 * at all, so a shopper had no way back to the cart or the account once they
 * left the home page.
 *
 * /login and /register stay outside: the auth screens are full-page designs
 * and already carry their own branding and navigation.
 */
export default function PublicLayout() {
  return (
    <>
      <ScrollToTop />
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  )
}
