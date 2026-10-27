import ForestButton from './forest/ForestButton'
import type { LucideIcon } from 'lucide-react'
type Props = { icon: LucideIcon; label: string; active?: boolean; onClick?: () => void }
export default function SidebarItem({
  icon: Icon,
  label,
  active = false,
  onClick
}: Props): React.JSX.Element {
  return (
    <ForestButton
      type="button"
      className={`sidebar-item${active ? ' sidebar-item--active' : ''}`}
      aria-current={active ? 'page' : undefined}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
      <span className="sidebar-item-label">{label}</span>
    </ForestButton>
  )
}
