import { useState } from 'react'
import { useCompanion } from '../state/useCompanion'
import { formatDateTime } from '../../../shared/dates'
import { leadTimes } from '../../../shared/models'
import Page, { Empty } from '../components/Page'
import { leadLabel } from '../../../shared/labels'
export default function Reminders(): React.JSX.Element {
  const { snapshot, dispatch } = useCompanion(),
    [error, setError] = useState('')
  const reminders = [...snapshot.data.reminders]
    .filter((r) => r.status !== 'dismissed')
    .sort((a, b) => a.notifyAt - b.notifyAt)
  async function change(minutes: number): Promise<void> {
    try {
      await dispatch({
        type: 'settings.save',
        value: { ...snapshot.data.settings, reminderLeadMinutes: minutes }
      })
      setError('')
    } catch (e) {
      setError(String(e))
    }
  }
  return (
    <Page title="Reminders" subtitle="Gentle nudges for task deadlines and calendar events.">
      <div className="panel">
        <label className="form-field">
          <span>Default advance notice</span>
          <select
            value={snapshot.data.settings.reminderLeadMinutes}
            onChange={(e) => void change(+e.target.value)}
          >
            {leadTimes.map((t) => (
              <option key={t} value={t}>
                {leadLabel(t)}
              </option>
            ))}
          </select>
        </label>
        <p className="muted">
          Windows notifications work while Study Companion is running. Notification preferences are
          in Settings. Late reminders are listed as missed; old reminders will not trigger a burst
          of notifications.
        </p>
        {!snapshot.notificationSupported && (
          <p className="error">Desktop notifications are unavailable on this system.</p>
        )}
        {!snapshot.data.settings.remindersEnabled && (
          <p className="muted">Reminders are disabled in Settings.</p>
        )}
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="item-list">
        {reminders.map((reminder) => (
          <div className="item-row" key={reminder.id}>
            <div className="item-copy">
              <strong>{reminder.title}</strong>
              <span className="badge">
                {reminder.status === 'delivered' ? 'Sent to Windows' : reminder.status}
              </span>
              <span className="muted">
                {reminder.sourceType} · Due {formatDateTime(reminder.dueAt)}
              </span>
              <p className="muted">Notify {formatDateTime(reminder.notifyAt)}</p>
            </div>
            <button
              onClick={() =>
                void dispatch({ type: 'reminder.dismiss', id: reminder.id }).catch((e) =>
                  setError(String(e))
                )
              }
            >
              Dismiss
            </button>
          </div>
        ))}
      </div>
      {!reminders.length && (
        <Empty>No reminders to show. Add a task or calendar event to schedule one.</Empty>
      )}
    </Page>
  )
}
