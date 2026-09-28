import { useRef, useState, useCallback } from 'react'
import { productGallery, PLACEHOLDER_IMAGE } from '../utils/product'
import './ProductImageCarousel.css'

const SWIPE_THRESHOLD = 40

function ProductImageCarousel({
  product,
  className = '',
  overlay = null,
  zoomHint = null,
  showCounter = true,
  showThumbnails = true,
  allowLoop = true,
}) {
  const images = productGallery(product)
  const [active, setActive] = useState(0)
  const [zoom, setZoom] = useState(false)
  const [zoomOrigin, setZoomOrigin] = useState('50% 50%')
  const stageRef = useRef(null)
  const dragRef = useRef(null)

  const count = images.length
  const canNavigate = count > 1

  const navigate = useCallback(
    (dir) => {
      if (!canNavigate) return
      setActive((prev) => {
        if (allowLoop) return (prev + dir + count) % count
        return Math.min(Math.max(prev + dir, 0), count - 1)
      })
    },
    [count, allowLoop, canNavigate]
  )

  const goTo = useCallback((index) => {
    if (index >= 0 && index < count) setActive(index)
  }, [count])

  const handleZoom = (e) => {
    const rect = stageRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomOrigin(`${x}% ${y}%`)
  }

  const handlePointerDown = (e) => {
    dragRef.current = { x: e.clientX, y: e.clientY, swiped: false }
  }

  const handlePointerUp = (e) => {
    const drag = dragRef.current
    if (!drag) return
    const dx = e.clientX - drag.x
    const dy = e.clientY - drag.y
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy) * 1.5) {
      drag.swiped = true
      navigate(dx < 0 ? 1 : -1)
    }
  }

  const handlePointerCancel = () => {
    if (dragRef.current) dragRef.current.swiped = false
  }

  const handleClickToggleZoom = () => {
    if (dragRef.current?.swiped) {
      dragRef.current.swiped = false
      return
    }
    setZoom((prev) => !prev)
  }

  const handleStageKeyDown = (e) => {
    if (!canNavigate) return
    if (e.key === 'ArrowLeft') { e.preventDefault(); navigate(-1) }
    else if (e.key === 'ArrowRight') { e.preventDefault(); navigate(1) }
  }

  const handleImageError = (e) => {
    if (e.currentTarget.src !== PLACEHOLDER_IMAGE) {
      e.currentTarget.onerror = null
      e.currentTarget.src = PLACEHOLDER_IMAGE
    }
  }

  return (
    <div className="wc-carousel" aria-roledescription="carousel" aria-label={`${product?.name || 'Product'} images`}>
      <div
        ref={stageRef}
        className={`wc-carousel-stage ${className} ${zoom ? 'zoomed' : ''}`}
        onMouseMove={handleZoom}
        onMouseEnter={() => setZoom(true)}
        onMouseLeave={() => setZoom(false)}
        onClick={handleClickToggleZoom}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onKeyDown={handleStageKeyDown}
        tabIndex={0}
        role="img"
        aria-roledescription="slide"
        aria-label={`${product?.name || 'Product'} image ${active + 1} of ${count}`}
      >
        <img
          src={images[active]}
          alt={`${product?.name || 'Product'} - view ${active + 1}`}
          onError={handleImageError}
          style={{ transformOrigin: zoomOrigin }}
          draggable={false}
        />
        {overlay}
        {zoomHint}
        {canNavigate && (
          <>
            <button
              type="button"
              className="wc-nav wc-prev"
              onClick={(e) => { e.stopPropagation(); navigate(-1) }}
              aria-label="Previous image"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              className="wc-nav wc-next"
              onClick={(e) => { e.stopPropagation(); navigate(1) }}
              aria-label="Next image"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
            {showCounter && (
              <span className="wc-counter" aria-live="polite">{active + 1} / {count}</span>
            )}
          </>
        )}
      </div>

      {canNavigate && showThumbnails && (
        <div className="wc-thumbnails" role="tablist" aria-label={`${product?.name || 'Product'} image thumbnails`}>
          {images.map((img, index) => (
            <button
              key={index}
              type="button"
              className={`wc-thumb ${index === active ? 'active' : ''}`}
              onClick={() => goTo(index)}
              aria-label={`View image ${index + 1}`}
              aria-selected={index === active}
              role="tab"
            >
              <img
                src={img}
                alt=""
                onError={handleImageError}
                draggable={false}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default ProductImageCarousel
