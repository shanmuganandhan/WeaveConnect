import { useEffect } from 'react'

export default function useEscape(onEscape) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onEscape()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onEscape])
}
