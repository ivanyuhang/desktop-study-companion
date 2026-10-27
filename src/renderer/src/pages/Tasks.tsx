import { useNow } from '../state/useNow'
import { useState } from 'react'
import { BookOpen, CircleHelp, GraduationCap } from 'lucide-react'
import type { StudyTask } from '../../../shared/models'
import { dateKey, taskDeadline, formatDateTime } from '../../../shared/dates'
import { useCompanion } from '../state/useCompanion'
import Page, { Empty } from '../components/Page'
import Dialog, { ConfirmDialog } from '../components/Dialog'
import Field from '../components/FormField'
const icons = { homework: BookOpen, quiz: CircleHelp, exam: GraduationCap }
export default function Tasks(): React.JSX.Element {
  const { snapshot, dispatch } = useCompanion()
  const now = useNow()
  const [editing, setEditing] = useState<StudyTask | null>(null),
    [deleting, setDeleting] = useState<StudyTask | null>(null)
  const [category, setCategory] = useState('all'),
    [status, setStatus] = useState('all'),
    [error, setError] = useState('')
  const tasks = snapshot.data.tasks
    .filter((t) => category === 'all' || t.category === category)
    .sort((a, b) => taskDeadline(a) - taskDeadline(b))
  async function toggle(task: StudyTask): Promise<void> {
    try {
      await dispatch({ type: 'task.save', value: { ...task, completed: !task.completed } })
      setError('')
    } catch (e) {
      setError(String(e))
    }
  }
  return (
    <Page
      title="Tasks & Exams"
      subtitle="Keep deadlines in sight and make progress one task at a time."
      actions={
        <button
          className="primary"
          onClick={() =>
            setEditing({
              id: crypto.randomUUID(),
              title: '',
              description: '',
              course: '',
              category: 'homework',
              dueDate: dateKey(),
              dueTime: '',
              createdAt: new Date().toISOString(),
              completed: false
            })
          }
        >
          Add task
        </button>
      }
    >
      <div className="toolbar">
        <select
          aria-label="Filter category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="all">All categories</option>
          <option value="homework">Homework</option>
          <option value="quiz">Quiz</option>
          <option value="exam">Exam</option>
        </select>
        <select
          aria-label="Filter completion"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="incomplete">Incomplete</option>
          <option value="completed">Completed</option>
        </select>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {[false, true]
        .filter(
          (done) => status === 'all' || (done ? status === 'completed' : status === 'incomplete')
        )
        .map((done) => (
          <section className="panel" key={String(done)}>
            <h2>{done ? 'Completed' : 'Upcoming & overdue'}</h2>
            <div className="item-list">
              {tasks
                .filter((t) => t.completed === done)
                .map((task) => {
                  const Icon = icons[task.category]
                  const overdue = !done && taskDeadline(task) < now
                  return (
                    <div className={'item-row' + (done ? ' completed' : '')} key={task.id}>
                      <input
                        type="checkbox"
                        aria-label={'Complete ' + task.title}
                        checked={done}
                        onChange={() => void toggle(task)}
                      />
                      <Icon size={20} aria-hidden="true" />
                      <div className="item-copy">
                        <strong>{task.title}</strong>
                        <span className="badge">{task.category}</span>
                        <span className={overdue ? 'overdue' : 'muted'}>
                          {overdue ? 'Overdue · ' : ''}
                          {formatDateTime(taskDeadline(task))}
                          {task.course && ' · ' + task.course}
                        </span>
                        {task.description && <p className="muted">{task.description}</p>}
                      </div>
                      <div className="row-actions">
                        <button onClick={() => setEditing(task)}>Edit</button>
                        <button className="danger" onClick={() => setDeleting(task)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                })}
            </div>
            {!tasks.some((t) => t.completed === done) && (
              <Empty>
                {done ? 'No completed tasks in this view.' : 'No pending tasks in this view.'}
              </Empty>
            )}
          </section>
        ))}
      {editing && (
        <TaskDialog
          item={editing}
          onClose={() => setEditing(null)}
          onSave={(value) => dispatch({ type: 'task.save', value })}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title={'Delete ' + deleting.title + '?'}
          onClose={() => setDeleting(null)}
          onConfirm={() => dispatch({ type: 'task.delete', id: deleting.id })}
        />
      )}
    </Page>
  )
}
function TaskDialog({
  item,
  onClose,
  onSave
}: {
  item: StudyTask
  onClose: () => void
  onSave: (item: StudyTask) => Promise<void>
}): React.JSX.Element {
  const [value, setValue] = useState(item)
  const field = <K extends keyof StudyTask>(key: K, next: StudyTask[K]): void =>
    setValue({ ...value, [key]: next })
  return (
    <Dialog
      title="Task details"
      onClose={onClose}
      onSubmit={() => onSave({ ...value, title: value.title.trim() })}
    >
      <Field label="Title">
        <input
          autoFocus
          required
          maxLength={200}
          value={value.title}
          onChange={(e) => field('title', e.target.value)}
        />
      </Field>
      <Field label="Description (optional)">
        <textarea
          value={value.description}
          onChange={(e) => field('description', e.target.value)}
        />
      </Field>
      <Field label="Course / subject (optional)">
        <input value={value.course} onChange={(e) => field('course', e.target.value)} />
      </Field>
      <Field label="Category">
        <select
          value={value.category}
          onChange={(e) => field('category', e.target.value as StudyTask['category'])}
        >
          <option value="homework">Homework</option>
          <option value="quiz">Quiz</option>
          <option value="exam">Exam</option>
        </select>
      </Field>
      <div className="form-grid">
        <Field label="Due date">
          <input
            type="date"
            required
            value={value.dueDate}
            onChange={(e) => field('dueDate', e.target.value)}
          />
        </Field>
        <Field label="Due time (optional)">
          <input
            type="time"
            value={value.dueTime}
            onChange={(e) => field('dueTime', e.target.value)}
          />
        </Field>
      </div>
      <p className="muted">Without a time, the deadline is 23:59 local time.</p>
    </Dialog>
  )
}
