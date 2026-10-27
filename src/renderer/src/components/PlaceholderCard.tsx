import ForestPanel from './forest/ForestPanel'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

type PlaceholderCardProps = {
  icon: LucideIcon
  title: string
  subtitle: string
  children: ReactNode
  className?: string
}

export default function PlaceholderCard({
  icon: Icon,
  title,
  subtitle,
  children,
  className = ''
}: PlaceholderCardProps): React.JSX.Element {
  return (
    <ForestPanel className={`placeholder-card ${className}`.trim()}>
      <div className="card-heading">
        <span className="card-icon" aria-hidden="true">
          <Icon size={19} strokeWidth={1.9} />
        </span>
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
      <div className="card-content">{children}</div>
    </ForestPanel>
  )
}
