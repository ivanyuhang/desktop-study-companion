import { app, Notification, powerMonitor } from 'electron'
import { JsonStore } from './store'
import { advanceFocus } from '../shared/focus'
import { reconcileReminders, claimDueReminders } from '../shared/reminders'
import type { Reminder } from '../shared/models'
export function startScheduler(
  store: JsonStore,
  broadcast: () => void,
  warn: (message: string) => void
): void {
  let busy = false
  const tick = async (): Promise<void> => {
    if (busy) return
    busy = true
    try {
      const now = Date.now(),
        before = store.read(),
        probe = structuredClone(before)
      advanceFocus(probe, now)
      reconcileReminders(probe, now)
      claimDueReminders(probe, now)
      if (JSON.stringify(probe) === JSON.stringify(before)) return
      let due: Reminder[] = []
      await store.transact((data) => {
        advanceFocus(data, now)
        reconcileReminders(data, now)
        due = claimDueReminders(data, now)
      })
      broadcast()
      // Claim is durable before displaying: at most one attempt across app restarts.
      for (const reminder of due) {
        if (!Notification.isSupported()) {
          warn('Windows notifications are unavailable. Reminders remain visible in the app.')
          continue
        }
        const notification = new Notification({
          title: 'Study Companion · ' + reminder.title,
          body: 'Due ' + new Date(reminder.dueAt).toLocaleString()
        })
        notification.on('failed', (_event, error) =>
          warn('Windows could not display a reminder: ' + error)
        )
        notification.show()
      }
    } catch (error) {
      warn('Unable to update study tools: ' + String(error))
    } finally {
      busy = false
    }
  }
  const interval = setInterval(() => void tick(), 1000)
  const resume = (): void => {
    void tick()
  }
  powerMonitor.on('resume', resume)
  app.once('before-quit', () => {
    clearInterval(interval)
    powerMonitor.removeListener('resume', resume)
  })
  void tick()
}
