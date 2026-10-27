import { useState } from 'react'
import type { FormEvent } from 'react'
import { leadTimes } from '../../../shared/models'
import { useCompanion } from '../state/useCompanion'
import Page from '../components/Page'
import FocusFields from '../components/FocusFields'
import CompanionInfo from '../components/CompanionInfo'
import Field from '../components/FormField'
import { leadLabel } from '../../../shared/labels'
export default function Settings(): React.JSX.Element {
  const { snapshot, dispatch } = useCompanion()
  const [value, setValue] = useState(snapshot.data.settings),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false)
  async function save(event: FormEvent): Promise<void> {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      await dispatch({ type: 'settings.save', value })
      setMessage('Settings saved.')
    } catch (e) {
      setMessage(String(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <Page title="Settings" subtitle="Make room for the way you study.">
      <form onSubmit={save}>
        <section className="panel">
          <h2>Desktop Companion</h2>
          <CompanionInfo />
        </section>
        <section className="panel">
          <h2>Reminders</h2>
          <label>
            <input
              type="checkbox"
              checked={value.remindersEnabled}
              onChange={(e) => setValue({ ...value, remindersEnabled: e.target.checked })}
            />{' '}
            Enable reminders and Windows notifications
          </label>
          <Field label="Default advance notice">
            <select
              value={value.reminderLeadMinutes}
              onChange={(e) => setValue({ ...value, reminderLeadMinutes: +e.target.value })}
            >
              {leadTimes.map((t) => (
                <option key={t} value={t}>
                  {leadLabel(t)}
                </option>
              ))}
            </select>
          </Field>
          <p className="muted">
            Notifications require the app to be running and Windows notifications to be allowed.
          </p>
        </section>
        <section className="panel">
          <h2>Default focus session</h2>
          <FocusFields value={value.focus} onChange={(focus) => setValue({ ...value, focus })} />
          <p className="muted">
            Changes apply to new sessions. The current session keeps its configuration.
          </p>
        </section>
        <div className="toolbar">
          <button className="primary" disabled={busy}>
            {busy ? 'Saving…' : 'Save settings'}
          </button>
          {message && <p role="status">{message}</p>}
        </div>
      </form>
      <section className="panel">
        <h2>Application information</h2>
        <p>Study Companion · Version {snapshot.version}</p>
        <p className="muted">
          Your study data is stored locally in the application data directory.
        </p>
      </section>
    </Page>
  )
}
