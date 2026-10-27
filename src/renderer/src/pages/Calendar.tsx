import { useRef, useState } from 'react'
import type { CalendarEvent } from '../../../shared/models'
import {
  dateKey,
  eventOnDate,
  eventStart,
  formatDateTime,
  localTimestamp
} from '../../../shared/dates'
import { parseICS } from '../../../shared/ics'
import type { ImportResult } from '../../../shared/ics'
import { useCompanion } from '../state/useCompanion'
import Page, { Empty } from '../components/Page'
import Dialog, { ConfirmDialog } from '../components/Dialog'
import Field from '../components/FormField'
export default function Calendar(): React.JSX.Element {
  const { snapshot, dispatch } = useCompanion()
  const [month, setMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  )
  const [selected, setSelected] = useState(dateKey()),
    [editing, setEditing] = useState<CalendarEvent | null>(null),
    [deleting, setDeleting] = useState<CalendarEvent | null>(null)
  const [preview, setPreview] = useState<ImportResult | null>(null),
    [message, setMessage] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const start = new Date(month)
  start.setDate(1 - ((month.getDay() + 6) % 7))
  const dates = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
  const events = snapshot.data.events
    .filter((e) => eventOnDate(e, selected))
    .sort((a, b) => eventStart(a) - eventStart(b))
  const tasks = snapshot.data.tasks.filter((t) => t.dueDate === selected)
  function add(): void {
    setEditing({
      id: crypto.randomUUID(),
      title: '',
      description: '',
      start: selected + 'T09:00',
      end: selected + 'T10:00',
      allDay: false,
      color: '#8297f5'
    })
  }
  async function importFile(file: File | undefined): Promise<void> {
    if (!file) return
    try {
      if (file.size > 5_000_000) throw new Error('Choose an ICS file smaller than 5 MB.')
      setPreview(parseICS(await file.text(), snapshot.data.events))
      setMessage('')
    } catch (e) {
      setMessage(String(e))
    }
  }
  return (
    <Page
      title="Calendar"
      subtitle="Personal events and academic deadlines, together."
      actions={
        <>
          <button onClick={() => fileRef.current?.click()}>Import .ics</button>
          <button className="primary" onClick={add}>
            Add event
          </button>
        </>
      }
    >
      <input
        ref={fileRef}
        type="file"
        accept=".ics,text/calendar"
        hidden
        onChange={(e) => {
          void importFile(e.target.files?.[0])
          e.target.value = ''
        }}
      />
      {message && (
        <p role="status" className="muted">
          {message}
        </p>
      )}
      <div className="toolbar">
        <button
          aria-label="Previous month"
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
        >
          ‹
        </button>
        <h2>{month.toLocaleDateString([], { month: 'long', year: 'numeric' })}</h2>
        <button
          aria-label="Next month"
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
        >
          ›
        </button>
        <button
          onClick={() => {
            setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
            setSelected(dateKey())
          }}
        >
          Today
        </button>
      </div>
      <div className="calendar-grid">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <strong className="calendar-weekday" key={d}>
            {d}
          </strong>
        ))}
        {dates.map((date) => {
          const key = dateKey(date)
          const dayEvents = snapshot.data.events.filter((e) => eventOnDate(e, key))
          const deadlines = snapshot.data.tasks.filter((t) => t.dueDate === key)
          return (
            <button
              key={key}
              className={
                'calendar-day' +
                (key === selected ? ' selected' : '') +
                (key === dateKey() ? ' today' : '') +
                (date.getMonth() !== month.getMonth() ? ' outside' : '')
              }
              aria-label={key + ', ' + (dayEvents.length + deadlines.length) + ' items'}
              aria-pressed={key === selected}
              onClick={() => setSelected(key)}
            >
              <span>{date.getDate()}</span>
              {[
                ...dayEvents.map((e) => ({ id: e.id, title: e.title, color: e.color })),
                ...deadlines.map((t) => ({
                  id: t.id,
                  title: (t.completed ? '✓ ' : '') + t.title,
                  color: '#eab76a'
                }))
              ]
                .slice(0, 2)
                .map((item) => (
                  <small key={item.id} style={{ borderLeftColor: item.color }}>
                    {item.title}
                  </small>
                ))}
              {dayEvents.length + deadlines.length > 2 && (
                <small>+{dayEvents.length + deadlines.length - 2} more</small>
              )}
            </button>
          )
        })}
      </div>
      <section className="panel">
        <h2>{new Date(selected + 'T00:00:00').toLocaleDateString([], { dateStyle: 'full' })}</h2>
        {!events.length && !tasks.length && <Empty>No events or deadlines on this date.</Empty>}
        <div className="item-list">
          {events.map((event) => (
            <div className="item-row" key={event.id}>
              <div className="item-copy">
                <strong>{event.title}</strong>
                <span className="muted">
                  {event.allDay
                    ? 'All day'
                    : formatDateTime(eventStart(event)) +
                      ' – ' +
                      formatDateTime(new Date(event.end).getTime())}
                </span>
                {event.description && <p className="muted">{event.description}</p>}
              </div>
              <div className="row-actions">
                <button onClick={() => setEditing(event)}>Edit</button>
                <button className="danger" onClick={() => setDeleting(event)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
          {tasks.map((task) => (
            <div className="item-row" key={task.id}>
              <div className="item-copy">
                <strong>
                  {task.completed ? '✓ ' : ''}
                  {task.title}
                </strong>
                <span className="muted">
                  {task.category} deadline · {task.dueTime || '23:59'} · Edit in Tasks & Exams
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
      {editing && (
        <EventDialog
          item={editing}
          onClose={() => setEditing(null)}
          onSave={(value) => dispatch({ type: 'event.save', value })}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title={'Delete ' + deleting.title + '?'}
          onClose={() => setDeleting(null)}
          onConfirm={() => dispatch({ type: 'event.delete', id: deleting.id })}
        />
      )}
      {preview && (
        <Dialog
          title="Import calendar copies"
          submitLabel={'Import ' + preview.events.length + ' events'}
          onClose={() => setPreview(null)}
          onSubmit={async () => {
            await dispatch({ type: 'events.import', values: preview.events })
            setMessage('Imported ' + preview.events.length + ' local editable events.')
          }}
        >
          <p>
            {preview.events.length} new events; {preview.duplicates} duplicates skipped.
          </p>
          <p className="muted">
            One-time import only. Recurring series and unsupported entries are skipped and listed
            below.
          </p>
          {preview.warnings.length > 0 && (
            <div className="import-warnings">
              {preview.warnings.map((w, i) => (
                <p key={i}>{w}</p>
              ))}
            </div>
          )}
          <ul>
            {preview.events.slice(0, 8).map((e) => (
              <li key={e.id}>
                {e.title} · {e.start.slice(0, 10)}
              </li>
            ))}
          </ul>
        </Dialog>
      )}
    </Page>
  )
}
function localInput(value: string): string {
  const d = new Date(value)
  return (
    dateKey(d) +
    'T' +
    String(d.getHours()).padStart(2, '0') +
    ':' +
    String(d.getMinutes()).padStart(2, '0')
  )
}
function EventDialog({
  item,
  onClose,
  onSave
}: {
  item: CalendarEvent
  onClose: () => void
  onSave: (item: CalendarEvent) => Promise<void>
}): React.JSX.Element {
  const [value, setValue] = useState({
    ...item,
    start: item.allDay ? item.start : localInput(item.start),
    end: item.allDay ? item.end : localInput(item.end)
  })
  const field = <K extends keyof CalendarEvent>(key: K, next: CalendarEvent[K]): void =>
    setValue({ ...value, [key]: next })
  function toggle(allDay: boolean): void {
    const start = value.start.slice(0, 10)
    const next = new Date(localTimestamp(start))
    next.setDate(next.getDate() + 1)
    setValue({
      ...value,
      allDay,
      start: allDay ? start : start + 'T09:00',
      end: allDay ? dateKey(next) : start + 'T10:00'
    })
  }
  return (
    <Dialog
      title="Event details"
      onClose={onClose}
      onSubmit={() =>
        onSave({
          ...value,
          title: value.title.trim(),
          start: value.allDay ? value.start : new Date(value.start).toISOString(),
          end: value.allDay ? value.end : new Date(value.end).toISOString()
        })
      }
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
      <Field label="Description">
        <textarea
          value={value.description}
          onChange={(e) => field('description', e.target.value)}
        />
      </Field>
      <label>
        <input type="checkbox" checked={value.allDay} onChange={(e) => toggle(e.target.checked)} />{' '}
        All-day event
      </label>
      <Field label="Start">
        <input
          required
          type={value.allDay ? 'date' : 'datetime-local'}
          value={value.start}
          onChange={(e) => field('start', e.target.value)}
        />
      </Field>
      <Field label={value.allDay ? 'End date (exclusive — next day for one-day events)' : 'End'}>
        <input
          required
          type={value.allDay ? 'date' : 'datetime-local'}
          value={value.end}
          onChange={(e) => field('end', e.target.value)}
        />
      </Field>
      <Field label="Category color">
        <input type="color" value={value.color} onChange={(e) => field('color', e.target.value)} />
      </Field>
    </Dialog>
  )
}
