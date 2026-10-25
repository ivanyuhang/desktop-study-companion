import { Bell, CalendarDays, ListTodo, Timer } from 'lucide-react'
import PlaceholderCard from './PlaceholderCard'

export default function DashboardPlaceholder(): React.JSX.Element {
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-eyebrow">
          <span className="eyebrow-dot" />
          YOUR WORKSPACE
        </div>
        <h1>Welcome to Study Companion</h1>
        <p>Your study space, all in one place.</p>
      </header>

      <div className="overview-heading">
        <div>
          <h2>Today at a glance</h2>
          <p>A little clarity for the day ahead.</p>
        </div>
        <span className="overview-tag">DASHBOARD</span>
      </div>

      <div className="dashboard-grid">
        <PlaceholderCard
          icon={CalendarDays}
          title="Today's Classes"
          subtitle="Your schedule, simplified"
        >
          <div className="class-list">
            <div className="class-row">
              <span className="class-time">09:00</span>
              <span className="class-details">
                <strong>Mathematics</strong>
                <small>Room 204</small>
              </span>
              <span className="class-indicator" />
            </div>
            <div className="class-row">
              <span className="class-time">11:30</span>
              <span className="class-details">
                <strong>Literature</strong>
                <small>Room 118</small>
              </span>
              <span className="class-indicator" />
            </div>
          </div>
        </PlaceholderCard>

        <PlaceholderCard
          icon={ListTodo}
          title="Upcoming Tasks"
          subtitle="A couple of things on your radar"
        >
          <div className="task-list">
            <div className="task-row">
              <span className="task-check" />
              <span className="task-details">
                <strong>Complete chapter notes</strong>
                <small>Biology · Due tomorrow</small>
              </span>
            </div>
            <div className="task-row">
              <span className="task-check" />
              <span className="task-details">
                <strong>Review practice questions</strong>
                <small>Mathematics · Upcoming</small>
              </span>
            </div>
          </div>
        </PlaceholderCard>

        <PlaceholderCard icon={Bell} title="Next Reminder" subtitle="Something worth remembering">
          <div className="reminder-block">
            <span className="reminder-time">
              4:30 <small>PM</small>
            </span>
            <strong>Review biology notes</strong>
            <p>A gentle nudge to keep the details fresh.</p>
            <span className="reminder-tag">TOMORROW · STUDY PLAN</span>
          </div>
        </PlaceholderCard>

        <PlaceholderCard icon={Timer} title="Focus Session" subtitle="Make room for deep work">
          <div className="focus-block">
            <span className="focus-time">25:00</span>
            <div className="focus-rule" />
            <strong>Ready when you are</strong>
            <p>A clear stretch of time for one thing at a time.</p>
            <span className="focus-tag">SESSION LENGTH · 25 MINUTES</span>
          </div>
        </PlaceholderCard>
      </div>
    </div>
  )
}
