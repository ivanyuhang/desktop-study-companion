import type { AppData, Command, FocusSession } from './models.ts'
import { validateFocus } from './validation.ts'
function duration(session: FocusSession): number {
  return (
    (session.phase === 'study' ? session.settings.studyMinutes : session.settings.breakMinutes) *
    60000
  )
}
export function remainingFocus(session: FocusSession | null, now: number): number {
  if (!session || session.state === 'completed') return 0
  return session.state === 'running'
    ? Math.max(0, (session.endsAt ?? now) - now)
    : session.remainingMs
}
export function advanceFocus(data: AppData, now: number): boolean {
  const session = data.focusSession
  if (!session || session.state !== 'running' || session.endsAt === null || session.endsAt > now)
    return false
  if (session.phase === 'study') {
    const id = session.id + ':' + session.round
    if (!data.focusHistory.some((p) => p.id === id))
      data.focusHistory.push({
        id,
        sessionId: session.id,
        round: session.round,
        completedAt: session.endsAt,
        durationMs: session.settings.studyMinutes * 60000
      })
    if (session.round === session.settings.rounds) {
      session.state = 'completed'
      session.endsAt = null
      session.remainingMs = 0
      return true
    }
    session.phase = 'break'
  } else {
    session.phase = 'study'
    session.round++
  }
  session.remainingMs = duration(session)
  // A late tick starts the next period now; it must never fabricate unattended rounds.
  session.endsAt = now + session.remainingMs
  return true
}
export function focusCommand(data: AppData, command: Command, now: number): void {
  advanceFocus(data, now)
  if (command.type === 'focus.start') {
    validateFocus(command.settings)
    if (data.focusSession && ['running', 'paused'].includes(data.focusSession.state))
      throw new Error('Finish the current session before starting another.')
    data.focusSession = {
      id: crypto.randomUUID(),
      settings: { ...command.settings },
      state: 'running',
      phase: 'study',
      round: 1,
      endsAt: now + command.settings.studyMinutes * 60000,
      remainingMs: command.settings.studyMinutes * 60000
    }
    return
  }
  const session = data.focusSession
  if (!session || session.state === 'completed') throw new Error('No active focus session')
  if (command.type === 'focus.pause' && session.state === 'running') {
    session.remainingMs = remainingFocus(session, now)
    session.endsAt = null
    session.state = 'paused'
  } else if (command.type === 'focus.resume' && session.state === 'paused') {
    session.endsAt = now + session.remainingMs
    session.state = 'running'
  } else if (command.type === 'focus.restart') {
    session.remainingMs = duration(session)
    if (session.state === 'running') session.endsAt = now + session.remainingMs
  } else throw new Error('This focus action is unavailable')
}
