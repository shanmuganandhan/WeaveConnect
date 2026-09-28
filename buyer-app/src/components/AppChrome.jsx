import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export function PageLoader() {
  return <div className="app-page-loader">Loading…</div>
}

export function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}
