import DesktopPet from '../pages/DesktopPet'
import Settings from '../pages/Settings'
import FocusTimer from '../pages/FocusTimer'
import Reminders from '../pages/Reminders'
import Timetable from '../pages/Timetable'
import Tasks from '../pages/Tasks'
import Calendar from '../pages/Calendar'
import { useState } from 'react'
import type { PageId } from '../../../shared/models'
import DashboardPlaceholder from './DashboardPlaceholder'
import Sidebar from './Sidebar'

export default function AppLayout(): React.JSX.Element {
  const [page, setPage] = useState<PageId>('Dashboard')
  return (
    <div className="app-shell forest-theme">
      <Sidebar page={page} onNavigate={setPage} />
      <main className="main-content">
        <div className="content-wrap">
          {page === 'Dashboard' ? (
            <DashboardPlaceholder />
          ) : page === 'Timetable' ? (
            <Timetable />
          ) : page === 'Tasks & Exams' ? (
            <Tasks />
          ) : page === 'Calendar' ? (
            <Calendar />
          ) : page === 'Focus Timer' ? (
            <FocusTimer />
          ) : page === 'Reminders' ? (
            <Reminders />
          ) : page === 'Desktop Pet' ? (
            <DesktopPet />
          ) : (
            <Settings />
          )}
        </div>
      </main>
    </div>
  )
}
