import type { LucideIcon } from 'lucide-react'

type SidebarItemProps = {
  icon: LucideIcon
  label: string
  active?: boolean
}

export default function SidebarItem({
  icon: Icon,
  label,
  active = false
}: SidebarItemProps): React.JSX.Element {
  return (
    <div
      className={`sidebar-item${active ? ' sidebar-item--active' : ''}`}
      aria-current={active ? 'page' : undefined}
      title={label}
    >
      <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
      <span className="sidebar-item-label">{label}</span>
    </div>
  )
}
