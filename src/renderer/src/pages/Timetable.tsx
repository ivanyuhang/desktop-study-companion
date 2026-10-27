import { useState } from 'react'
import type { ClassSchedule } from '../../../shared/models'
import { minutesTime, timeMinutes } from '../../../shared/dates'
import { useCompanion } from '../state/useCompanion'
import Page, { Empty } from '../components/Page'
import Dialog, { ConfirmDialog } from '../components/Dialog'
import Field from '../components/FormField'
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
export default function Timetable(): React.JSX.Element {
  const { snapshot, dispatch } = useCompanion()
  const classes = snapshot.data.classes
  const [editing, setEditing] = useState<ClassSchedule | null>(null)
  const [deleting, setDeleting] = useState<ClassSchedule | null>(null)
  const [error, setError] = useState('')
  const start = Math.min(
    8 * 60,
    ...classes.map((c) => Math.floor(timeMinutes(c.startTime) / 60) * 60)
  )
  const end = Math.max(20 * 60, ...classes.map((c) => Math.ceil(timeMinutes(c.endTime) / 60) * 60))
  function add(day = 0, minutes = 9 * 60): void {
    setEditing({
      id: crypto.randomUUID(),
      course: '',
      day,
      startTime: minutesTime(minutes),
      endTime: minutesTime(Math.min(minutes + 60, 1439)),
      location: '',
      teacher: '',
      color: '#8297f5'
    })
  }
  async function move(id: string, day: number, minutes: number): Promise<void> {
    const item = classes.find((c) => c.id === id)
    if (!item) return
    const duration = timeMinutes(item.endTime) - timeMinutes(item.startTime)
    if (minutes + duration > 1439) {
      setError('This class would extend past midnight.')
      return
    }
    try {
      await dispatch({
        type: 'class.save',
        value: {
          ...item,
          day,
          startTime: minutesTime(minutes),
          endTime: minutesTime(minutes + duration)
        }
      })
      setError('')
    } catch (reason) {
      setError(String(reason))
    }
  }
  return (
    <Page
      title="Timetable"
      subtitle="Your week, clearly arranged. Click a slot to add a class; drag a class to move it."
      actions={
        <button className="primary" onClick={() => add()}>
          Add class
        </button>
      }
    >
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="timetable-scroll">
        <div className="timetable" style={{ minWidth: 840 }}>
          <div className="week-heading">
            <span>Time</span>
            {days.map((day) => (
              <strong key={day}>{day.slice(0, 3)}</strong>
            ))}
          </div>
          <div className="week-body" style={{ height: (end - start) * 1.2 }}>
            <div className="time-axis">
              {Array.from({ length: (end - start) / 60 }, (_, i) => (
                <span key={i} style={{ top: i * 72 }}>
                  {minutesTime(start + i * 60)}
                </span>
              ))}
            </div>
            {days.map((day, index) => (
              <div className="day-column" key={day}>
                {Array.from({ length: (end - start) / 30 }, (_, i) => (
                  <button
                    className="time-slot"
                    key={i}
                    style={{ top: i * 36, height: 36 }}
                    aria-label={'Add class ' + day + ' ' + minutesTime(start + i * 30)}
                    onClick={() => add(index, start + i * 30)}
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.dataTransfer.dropEffect = 'move'
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      void move(e.dataTransfer.getData('text/plain'), index, start + i * 30)
                    }}
                  />
                ))}
                {classes
                  .filter((c) => c.day === index)
                  .map((c) => (
                    <button
                      className="class-block"
                      key={c.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', c.id)
                        e.dataTransfer.effectAllowed = 'move'
                      }}
                      onClick={() => setEditing(c)}
                      style={{
                        top: (timeMinutes(c.startTime) - start) * 1.2,
                        height: Math.max(
                          24,
                          (timeMinutes(c.endTime) - timeMinutes(c.startTime)) * 1.2 - 3
                        ),
                        borderLeftColor: c.color
                      }}
                      title={c.course + ' · ' + c.location}
                    >
                      <strong>{c.course}</strong>
                      <span>
                        {c.startTime}–{c.endTime}
                      </span>
                      <small>{c.location}</small>
                    </button>
                  ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="muted">
        Classes cannot overlap. Use Edit to move a class with the keyboard or set exact times.
      </p>
      <div className="panel">
        <h2>All classes</h2>
        {!classes.length && <Empty>No classes yet. Add your first course above.</Empty>}
        <div className="item-list">
          {[...classes]
            .sort((a, b) => a.day - b.day || a.startTime.localeCompare(b.startTime))
            .map((c) => (
              <div className="item-row" key={c.id}>
                <div className="item-copy">
                  <strong>{c.course}</strong>
                  <span className="muted">
                    {days[c.day]} · {c.startTime}–{c.endTime} · {c.location}
                    {c.teacher && ' · ' + c.teacher}
                  </span>
                </div>
                <div className="row-actions">
                  <button onClick={() => setEditing(c)}>Edit</button>
                  <button className="danger" onClick={() => setDeleting(c)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
      {editing && (
        <ClassDialog
          item={editing}
          onClose={() => setEditing(null)}
          onSave={(value) => dispatch({ type: 'class.save', value })}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title={'Delete ' + deleting.course + '?'}
          onClose={() => setDeleting(null)}
          onConfirm={() => dispatch({ type: 'class.delete', id: deleting.id })}
        />
      )}
    </Page>
  )
}
function ClassDialog({
  item,
  onClose,
  onSave
}: {
  item: ClassSchedule
  onClose: () => void
  onSave: (item: ClassSchedule) => Promise<void>
}): React.JSX.Element {
  const [value, setValue] = useState(item)
  const field = <K extends keyof ClassSchedule>(key: K, next: ClassSchedule[K]): void =>
    setValue({ ...value, [key]: next })
  return (
    <Dialog
      title="Class details"
      onClose={onClose}
      onSubmit={() => onSave({ ...value, course: value.course.trim() })}
    >
      <Field label="Course name">
        <input
          autoFocus
          required
          maxLength={150}
          value={value.course}
          onChange={(e) => field('course', e.target.value)}
        />
      </Field>
      <Field label="Day">
        <select value={value.day} onChange={(e) => field('day', +e.target.value)}>
          {days.map((day, i) => (
            <option key={day} value={i}>
              {day}
            </option>
          ))}
        </select>
      </Field>
      <div className="form-grid">
        <Field label="Start time">
          <input
            required
            type="time"
            value={value.startTime}
            onChange={(e) => field('startTime', e.target.value)}
          />
        </Field>
        <Field label="End time">
          <input
            required
            type="time"
            value={value.endTime}
            onChange={(e) => field('endTime', e.target.value)}
          />
        </Field>
      </div>
      <Field label="Classroom / location">
        <input value={value.location} onChange={(e) => field('location', e.target.value)} />
      </Field>
      <Field label="Teacher (optional)">
        <input value={value.teacher} onChange={(e) => field('teacher', e.target.value)} />
      </Field>
      <Field label="Color">
        <input type="color" value={value.color} onChange={(e) => field('color', e.target.value)} />
      </Field>
    </Dialog>
  )
}
