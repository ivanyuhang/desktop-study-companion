import {
  Bell,
  BookOpenCheck,
  Calendar,
  CalendarDays,
  Cat,
  LayoutDashboard,
  ListTodo,
  Settings,
  Timer
} from 'lucide-react'
import SidebarItem from './SidebarItem'

const mainItems = [
  { label: 'Dashboard', icon: LayoutDashboard, active: true },
  { label: 'Timetable', icon: CalendarDays },
  { label: 'Tasks & Exams', icon: ListTodo },
  { label: 'Calendar', icon: Calendar },
  { label: 'Reminders', icon: Bell },
  { label: 'Focus Timer', icon: Timer }
]

export default function Sidebar(): React.JSX.Element {
  return (
    <aside className="sidebar" aria-label="Application sidebar">
      <div className="sidebar-top">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <BookOpenCheck size={22} strokeWidth={1.9} />
          </div>
          <div className="brand-copy">
            <strong>Study Companion</strong>
            <span>Your Personal Workspace</span>
          </div>
        </div>

        <nav className="sidebar-navigation" aria-label="Sections">
          <div className="nav-group">
            <p className="nav-group-label">Main</p>
            {mainItems.map((item) => (
              <SidebarItem key={item.label} {...item} />
            ))}
          </div>
          <div className="nav-group nav-group--companion">
            <p className="nav-group-label">Companion</p>
            <SidebarItem icon={Cat} label="Desktop Pet" />
          </div>
        </nav>
      </div>

      <div className="sidebar-bottom">
        <SidebarItem icon={Settings} label="Settings" />
        <div className="sidebar-divider" />
        <div className="profile">
          <div className="profile-avatar" aria-hidden="true">
            S
          </div>
          <div className="profile-copy">
            <strong>Student</strong>
            <span>Personal Workspace</span>
          </div>
        </div>
        <span className="version-label">v0.1.0</span>
      </div>
    </aside>
  )
}
