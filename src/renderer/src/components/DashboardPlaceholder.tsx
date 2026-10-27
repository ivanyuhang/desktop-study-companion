import { Bell, CalendarDays, ListTodo, Timer } from 'lucide-react'
import PlaceholderCard from './PlaceholderCard'
import { Empty } from './Page'
import { useCompanion } from '../state/useCompanion'
import { useNow } from '../state/useNow'
import { dateKey, taskDeadline, formatDateTime } from '../../../shared/dates'
import { remainingFocus } from '../../../shared/focus'
export default function DashboardPlaceholder(): React.JSX.Element {
  const { snapshot } = useCompanion(),
    now = useNow()
  const today = new Date(now),
    data = snapshot.data
  const classes = data.classes
    .filter((c) => c.day === (today.getDay() + 6) % 7)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
  const tasks = data.tasks
    .filter((t) => !t.completed)
    .sort((a, b) => taskDeadline(a) - taskDeadline(b))
    .slice(0, 4)
  const reminders = data.reminders
    .filter((r) => r.status === 'pending')
    .sort((a, b) => a.notifyAt - b.notifyAt)
    .slice(0, 3)
  const session = data.focusSession
  const seconds = Math.ceil(
    session ? remainingFocus(session, now) / 1000 : data.settings.focus.studyMinutes * 60
  )
  const periods = data.focusHistory.filter(
    (p) => dateKey(new Date(p.completedAt)) === dateKey(today)
  )
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
            {classes.map((c) => (
              <div className="class-row" key={c.id}>
                <span className="class-time">
                  {c.startTime}
                  <br />
                  <small>{c.endTime}</small>
                </span>
                <span className="class-details">
                  <strong>{c.course}</strong>
                  <small>{c.location || 'No classroom set'}</small>
                </span>
                <span className="class-indicator" style={{ background: c.color }} />
              </div>
            ))}
          </div>
          {!classes.length && <Empty>No classes today. Enjoy the space in your schedule.</Empty>}
        </PlaceholderCard>
        <PlaceholderCard
          icon={ListTodo}
          title="Upcoming Tasks"
          subtitle="A couple of things on your radar"
        >
          <div className="task-list">
            {tasks.map((task) => (
              <div className="task-row" key={task.id}>
                <span className="task-check" />
                <span className="task-details">
                  <strong>{task.title}</strong>
                  <small className={taskDeadline(task) < now ? 'overdue' : ''}>
                    {taskDeadline(task) < now ? 'Overdue · ' : ''}
                    {task.category} · {formatDateTime(taskDeadline(task))}
                  </small>
                </span>
              </div>
            ))}
          </div>
          {!tasks.length && <Empty>No pending assignments, quizzes or exams.</Empty>}
        </PlaceholderCard>
        <PlaceholderCard
          icon={Bell}
          title="Upcoming Reminders"
          subtitle="Something worth remembering"
        >
          {reminders.map((reminder) => (
            <div className="dashboard-reminder" key={reminder.id}>
              <strong>{reminder.title}</strong>
              <p className="muted">Due {formatDateTime(reminder.dueAt)}</p>
              <small className="muted">Notify {formatDateTime(reminder.notifyAt)}</small>
            </div>
          ))}
          {!reminders.length && <Empty>No upcoming reminders.</Empty>}
        </PlaceholderCard>
        <PlaceholderCard icon={Timer} title="Focus Session" subtitle="Make room for deep work">
          <div className="focus-block">
            <span className="focus-time">
              {String(Math.floor(seconds / 60)).padStart(2, '0')}:
              {String(seconds % 60).padStart(2, '0')}
            </span>
            <strong>
              {!session
                ? 'Ready when you are'
                : session.state === 'completed'
                  ? 'Session completed'
                  : (session.phase === 'study' ? 'Study' : 'Break') + ' · ' + session.state}
            </strong>
            {session && session.state !== 'completed' && (
              <p>
                Round {session.round} of {session.settings.rounds}
              </p>
            )}
            <p>{periods.length} completed study periods today</p>
            <span className="focus-tag">
              {Math.round(periods.reduce((sum, p) => sum + p.durationMs, 0) / 60000)} MINUTES OF
              FOCUS TODAY
            </span>
          </div>
        </PlaceholderCard>
      </div>
    </div>
  )
}
