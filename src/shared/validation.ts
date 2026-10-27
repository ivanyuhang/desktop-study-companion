import { petIds, leadTimes } from './models.ts'
import type { AppData, FocusSettings, Command } from './models.ts'
import { validDate, validTime, timeMinutes } from './dates.ts'
function check(ok: unknown, message: string): asserts ok {
  if (!ok) throw new Error(message)
}
function object(value: unknown): asserts value is Record<string, unknown> {
  check(value && typeof value === 'object' && !Array.isArray(value), 'Invalid data object')
}
function text(value: unknown, label: string, required = false): void {
  check(
    typeof value === 'string' && value.length <= 10000 && (!required || value.trim().length > 0),
    'Invalid ' + label
  )
}
function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}
export function validateFocus(value: unknown): asserts value is FocusSettings {
  object(value)
  for (const [key, max] of [
    ['studyMinutes', 180],
    ['breakMinutes', 60],
    ['rounds', 12]
  ] as const)
    check(
      Number.isInteger(value[key]) && Number(value[key]) >= 1 && Number(value[key]) <= max,
      'Invalid ' + key + ' (1–' + max + ')'
    )
}
export function validateData(value: unknown): AppData {
  object(value)
  check(value.schemaVersion === 1, 'Unsupported data version')
  const data = value as unknown as AppData
  for (const key of ['classes', 'tasks', 'events', 'reminders', 'focusHistory'] as const) {
    check(Array.isArray(data[key]) && data[key].length <= 50000, 'Invalid ' + key)
    const ids = new Set<string>()
    for (const item of data[key]) {
      object(item)
      text(item.id, 'ID', true)
      check(!ids.has(item.id), 'Duplicate ID in ' + key)
      ids.add(item.id)
    }
  }
  for (const item of data.classes) {
    text(item.course, 'course', true)
    text(item.location, 'location')
    text(item.teacher, 'teacher')
    check(Number.isInteger(item.day) && item.day >= 0 && item.day <= 6, 'Invalid day')
    check(
      validTime(item.startTime) && validTime(item.endTime) && item.startTime < item.endTime,
      'Invalid class time interval'
    )
    check(/^#[0-9a-f]{6}$/i.test(item.color), 'Invalid color')
  }
  for (const item of data.tasks) {
    text(item.title, 'title', true)
    text(item.description, 'description')
    text(item.course, 'course')
    check(['homework', 'quiz', 'exam'].includes(item.category), 'Invalid category')
    check(validDate(item.dueDate), 'Invalid task date')
    check(item.dueTime === '' || validTime(item.dueTime), 'Invalid task time')
    check(typeof item.completed === 'boolean', 'Invalid completion status')
    check(
      typeof item.createdAt === 'string' && Number.isFinite(Date.parse(item.createdAt)),
      'Invalid creation timestamp'
    )
  }
  for (const item of data.events) {
    text(item.title, 'title', true)
    text(item.description, 'description')
    check(typeof item.allDay === 'boolean', 'Invalid all-day flag')
    check(/^#[0-9a-f]{6}$/i.test(item.color), 'Invalid color')
    if (item.allDay)
      check(
        validDate(item.start) && validDate(item.end) && item.end > item.start,
        'Invalid all-day date interval'
      )
    else
      check(
        typeof item.start === 'string' &&
          typeof item.end === 'string' &&
          /^\d{4}-\d{2}-\d{2}T/.test(item.start) &&
          validDate(item.start.slice(0, 10)) &&
          validDate(item.end.slice(0, 10)) &&
          Number.isFinite(Date.parse(item.start)) &&
          Date.parse(item.end) > Date.parse(item.start),
        'Invalid event time interval'
      )
    if (item.importKey !== undefined) text(item.importKey, 'import key', true)
  }
  object(data.settings)
  check(petIds.includes(data.settings.pet), 'Invalid pet')
  check(typeof data.settings.remindersEnabled === 'boolean', 'Invalid notification preference')
  check(
    (leadTimes as readonly number[]).includes(data.settings.reminderLeadMinutes),
    'Invalid reminder lead time'
  )
  validateFocus(data.settings.focus)
  for (const item of data.reminders) {
    text(item.sourceId, 'source ID', true)
    text(item.title, 'reminder title', true)
    check(
      ['task', 'event'].includes(item.sourceType) &&
        ['pending', 'delivered', 'dismissed', 'missed'].includes(item.status),
      'Invalid reminder'
    )
    check(finite(item.dueAt) && finite(item.notifyAt), 'Invalid reminder timestamp')
  }
  for (const item of data.focusHistory) {
    text(item.sessionId, 'session ID', true)
    check(
      Number.isInteger(item.round) &&
        item.round >= 1 &&
        finite(item.completedAt) &&
        finite(item.durationMs) &&
        item.durationMs > 0,
      'Invalid focus history'
    )
  }
  if (data.focusSession !== null) {
    const session = data.focusSession
    object(session)
    text(session.id, 'session ID', true)
    validateFocus(session.settings)
    check(
      ['idle', 'running', 'paused', 'completed'].includes(session.state) &&
        ['study', 'break'].includes(session.phase),
      'Invalid focus state'
    )
    check(
      Number.isInteger(session.round) &&
        session.round >= 1 &&
        session.round <= session.settings.rounds,
      'Invalid focus round'
    )
    check(
      finite(session.remainingMs) &&
        session.remainingMs >= 0 &&
        (session.endsAt === null || finite(session.endsAt)),
      'Invalid focus timestamp'
    )
    check(
      session.state !== 'running' || session.endsAt !== null,
      'Running session requires deadline'
    )
  }
  return structuredClone(data)
}
export function validateCommand(value: unknown): Command {
  object(value)
  text(value.type, 'command', true)
  const known = [
    'class.save',
    'class.delete',
    'task.save',
    'task.delete',
    'event.save',
    'event.delete',
    'events.import',
    'settings.save',
    'reminder.dismiss',
    'focus.start',
    'focus.pause',
    'focus.resume',
    'focus.restart'
  ]
  check(known.includes(String(value.type)), 'Unknown command')
  if (String(value.type).endsWith('.delete') || value.type === 'reminder.dismiss')
    text(value.id, 'ID', true)
  if (String(value.type).endsWith('.save')) object(value.value)
  if (value.type === 'focus.start') validateFocus(value.settings)
  if (value.type === 'events.import')
    check(Array.isArray(value.values) && value.values.length <= 5000, 'Invalid import')
  return value as unknown as Command
}
export function assertNoOverlap(data: AppData): void {
  for (let i = 0; i < data.classes.length; i++)
    for (let j = i + 1; j < data.classes.length; j++) {
      const a = data.classes[i],
        b = data.classes[j]
      if (
        a.day === b.day &&
        timeMinutes(a.startTime) < timeMinutes(b.endTime) &&
        timeMinutes(b.startTime) < timeMinutes(a.endTime)
      )
        throw new Error('Class overlaps with ' + b.course + '. Choose another time.')
    }
}
