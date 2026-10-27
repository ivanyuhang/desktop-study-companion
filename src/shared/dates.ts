import type { CalendarEvent, StudyTask } from './models.ts'
export function dateKey(value = new Date()): string {
  return [
    value.getFullYear(),
    String(value.getMonth() + 1).padStart(2, '0'),
    String(value.getDate()).padStart(2, '0')
  ].join('-')
}
export function validDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [y, m, d] = value.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return y >= 1900 && y <= 9999 && dateKey(date) === value
}
export function validTime(value: unknown): value is string {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
}
export function localTimestamp(date: string, time = '00:00'): number {
  return new Date(date + 'T' + time + ':00').getTime()
}
export function taskDeadline(task: StudyTask): number {
  return localTimestamp(task.dueDate, task.dueTime || '23:59')
}
export function eventStart(event: CalendarEvent): number {
  return event.allDay ? localTimestamp(event.start) : new Date(event.start).getTime()
}
export function eventOnDate(event: CalendarEvent, date: string): boolean {
  const start = localTimestamp(date)
  const tomorrow = new Date(start)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const end = event.allDay ? localTimestamp(event.end) : new Date(event.end).getTime()
  return eventStart(event) < tomorrow.getTime() && end > start
}
export function timeMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}
export function minutesTime(minutes: number): string {
  return (
    String(Math.floor(minutes / 60)).padStart(2, '0') + ':' + String(minutes % 60).padStart(2, '0')
  )
}
export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
}
