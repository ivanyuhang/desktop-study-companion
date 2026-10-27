import type { AppData, Reminder } from './models.ts'
import { eventStart, taskDeadline } from './dates.ts'
export function reconcileReminders(data: AppData, now: number): void {
  if (!data.settings.remindersEnabled) {
    data.reminders = []
    return
  }
  const previous = new Map(data.reminders.map((r) => [r.id, r]))
  const sources = [
    ...data.tasks
      .filter((t) => !t.completed)
      .map((t) => ({
        sourceType: 'task' as const,
        sourceId: t.id,
        title: t.title,
        dueAt: taskDeadline(t)
      })),
    ...data.events.map((e) => ({
      sourceType: 'event' as const,
      sourceId: e.id,
      title: e.title,
      dueAt: eventStart(e)
    }))
  ]
  data.reminders = sources.map((source) => {
    const notifyAt = source.dueAt - data.settings.reminderLeadMinutes * 60000
    const id = [
      source.sourceType,
      source.sourceId,
      source.dueAt,
      data.settings.reminderLeadMinutes
    ].join(':')
    const old = previous.get(id)
    return {
      ...source,
      id,
      notifyAt,
      status: old?.status ?? (notifyAt < now ? 'missed' : 'pending')
    }
  })
}
export function claimDueReminders(data: AppData, now: number): Reminder[] {
  const due: Reminder[] = []
  for (const reminder of data.reminders)
    if (reminder.status === 'pending' && reminder.notifyAt <= now) {
      if (now - reminder.notifyAt > 5 * 60000) reminder.status = 'missed'
      else {
        reminder.status = 'delivered'
        due.push({ ...reminder })
      }
    }
  return due
}
