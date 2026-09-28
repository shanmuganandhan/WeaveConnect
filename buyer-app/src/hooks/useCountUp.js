import { useEffect, useRef } from 'react'

function useCountUp() {
  const ref = useRef(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return

    const elements = root.querySelectorAll('[data-count]')
    if (elements.length === 0) return

    const animate = (el) => {
      const target = parseFloat(el.dataset.count)
      const suffix = el.dataset.suffix || ''
      const duration = 1600
      const start = performance.now()

      const step = (now) => {
        const progress = Math.min((now - start) / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        el.textContent = Math.round(target * eased).toLocaleString('en-IN') + suffix
        if (progress < 1) requestAnimationFrame(step)
      }

      requestAnimationFrame(step)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animate(entry.target)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.4 }
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return ref
}

export default useCountUp