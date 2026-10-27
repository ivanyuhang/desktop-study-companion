import ForestProgressRing from '../components/forest/ForestProgressRing'
import { useState } from 'react'
import { useCompanion } from '../state/useCompanion'
import { useNow } from '../state/useNow'
import { remainingFocus } from '../../../shared/focus'
import { dateKey } from '../../../shared/dates'
import type { Command } from '../../../shared/models'
import Page from '../components/Page'
import FocusFields from '../components/FocusFields'
export default function FocusTimer(): React.JSX.Element {
  const { snapshot, dispatch } = useCompanion(),
    now = useNow()
  const [settings, setSettings] = useState(snapshot.data.settings.focus),
    [error, setError] = useState('')
  const session = snapshot.data.focusSession
  const active = !!session && ['running', 'paused'].includes(session.state)
  const seconds = Math.ceil(
    active ? remainingFocus(session, now) / 1000 : settings.studyMinutes * 60
  )
  const periods = snapshot.data.focusHistory.filter(
    (p) => dateKey(new Date(p.completedAt)) === dateKey(new Date(now))
  )
  async function act(command: Command): Promise<void> {
    try {
      await dispatch(command)
      setError('')
    } catch (e) {
      setError(String(e))
    }
  }
  return (
    <Page
      title="Focus Timer"
      subtitle="One clear stretch of time. Your timer keeps running while you use other pages."
    >
      <div className="panel focus-panel">
        <span className="badge">
          {session?.state === 'completed'
            ? 'Session completed'
            : active
              ? session.phase === 'study'
                ? 'Study period'
                : 'Take a break'
              : 'Ready when you are'}
        </span>
        <ForestProgressRing
          label="Current period progress"
          active={session?.state === 'running'}
          value={
            session?.state === 'completed'
              ? 100
              : active
                ? 100 *
                  (1 -
                    seconds /
                      ((session.phase === 'study'
                        ? session.settings.studyMinutes
                        : session.settings.breakMinutes) *
                        60))
                : 0
          }
        >
          <div className="timer-display" role="timer" aria-label="Time remaining">
            {session?.state === 'completed'
              ? '00:00'
              : String(Math.floor(seconds / 60)).padStart(2, '0') +
                ':' +
                String(seconds % 60).padStart(2, '0')}
          </div>
          <span className="forest-timer-caption">A moment to focus</span>
        </ForestProgressRing>
        <p>
          {active
            ? 'Round ' + session.round + ' of ' + session.settings.rounds + ' · ' + session.state
            : session?.state === 'completed'
              ? 'All study rounds finished. Well done.'
              : 'Set your pace below.'}
        </p>
        <div className="toolbar">
          {!active && (
            <button className="primary" onClick={() => void act({ type: 'focus.start', settings })}>
              Start
            </button>
          )}
          {session?.state === 'running' && (
            <button onClick={() => void act({ type: 'focus.pause' })}>Pause</button>
          )}
          {session?.state === 'paused' && (
            <button className="primary" onClick={() => void act({ type: 'focus.resume' })}>
              Resume
            </button>
          )}
          {active && (
            <button onClick={() => void act({ type: 'focus.restart' })}>
              Restart current period
            </button>
          )}
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </div>
      <section className="panel">
        <h2>Session configuration</h2>
        <FocusFields
          value={active ? session.settings : settings}
          onChange={setSettings}
          disabled={active}
        />
        <p className="muted">
          Defaults are saved in Settings. No break follows the final study round. After sleep or an
          interruption, the next period begins when the app wakes.
        </p>
      </section>
      <section className="panel">
        <h2>Today’s focus</h2>
        <p>
          {periods.length} completed study periods ·{' '}
          {Math.round(periods.reduce((sum, p) => sum + p.durationMs, 0) / 60000)} minutes
        </p>
      </section>
    </Page>
  )
}
