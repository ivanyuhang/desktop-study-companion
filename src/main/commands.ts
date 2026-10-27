import { focusCommand } from '../shared/focus.ts'
import { reconcileReminders } from '../shared/reminders.ts'
import type { AppData, Command } from '../shared/models.ts'
import { assertNoOverlap, validateData } from '../shared/validation.ts'
export function applyCommand(data: AppData, command: Command): void {
  const upsert = <T extends { id: string }>(items: T[], item: T): T[] => [
    ...items.filter((old) => old.id !== item.id),
    item
  ]
  switch (command.type) {
    case 'class.save':
      data.classes = upsert(data.classes, command.value)
      validateData(data)
      assertNoOverlap(data)
      break
    case 'class.delete':
      data.classes = data.classes.filter((item) => item.id !== command.id)
      break
    case 'task.save':
      data.tasks = upsert(data.tasks, command.value)
      break
    case 'task.delete':
      data.tasks = data.tasks.filter((item) => item.id !== command.id)
      break
    case 'event.save':
      data.events = upsert(data.events, command.value)
      break
    case 'event.delete':
      data.events = data.events.filter((item) => item.id !== command.id)
      break
    case 'settings.save':
      data.settings = command.value
      break
    case 'reminder.dismiss':
      data.reminders.forEach((item) => {
        if (item.id === command.id) item.status = 'dismissed'
      })
      break
    case 'events.import':
      for (const item of command.values)
        if (
          !data.events.some(
            (old) => old.id === item.id || (item.importKey && old.importKey === item.importKey)
          )
        )
          data.events.push(item)
      break
    default:
      focusCommand(data, command, Date.now())
  }
  reconcileReminders(data, Date.now())
}
