import { useCallback, useRef, useState } from 'react'

export function useToast() {
  const [toast, setToast] = useState(null)
  const timerRef = useRef(null)

  const showToast = useCallback((message, type = 'success') => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setToast({ id: Date.now(), message, type })
    timerRef.current = setTimeout(() => setToast(null), 2600)
  }, [])

  return { toast, showToast }
}
