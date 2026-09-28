import { useEffect, useState } from 'react'

export default function useSimulatedLoading(delay = 700) {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return loading
}
