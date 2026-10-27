import type { ReactNode } from 'react'
interface ForestProgressRingProps {
  value: number
  children: ReactNode
  label: string
  active?: boolean
}
export default function ForestProgressRing({
  value,
  children,
  label,
  active = false
}: ForestProgressRingProps): React.JSX.Element {
  const progress = Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0))
  return (
    <div className={`forest-progress-ring${active ? ' is-active' : ''}`}>
      <svg
        className="forest-progress-track"
        viewBox="0 0 240 240"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
      >
        <circle className="forest-track" cx="120" cy="120" r="72" />
        <circle
          className="forest-progress"
          cx="120"
          cy="120"
          r="72"
          pathLength="100"
          strokeDasharray="100"
          strokeDashoffset={100 - progress}
        />
      </svg>
      <div className="forest-progress-content">{children}</div>
    </div>
  )
}
