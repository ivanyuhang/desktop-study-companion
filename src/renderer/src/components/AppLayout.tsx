import DashboardPlaceholder from './DashboardPlaceholder'
import Sidebar from './Sidebar'

export default function AppLayout(): React.JSX.Element {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="content-wrap">
          <DashboardPlaceholder />
        </div>
      </main>
    </div>
  )
}
