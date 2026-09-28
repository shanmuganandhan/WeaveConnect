import useCountUp from '../../hooks/useCountUp'

export default function CountUp({ value, suffix = '', className = '' }) {
  const ref = useCountUp()

  return (
    <span
      ref={ref}
      className={className}
      data-count={value}
      data-suffix={suffix}
      aria-live="polite"
    >
      0
    </span>
  )
}
