import type { CalendarEvent } from './models.ts'
import { validDate, dateKey, validTime } from './dates.ts'
export interface ImportResult {
  events: CalendarEvent[]
  duplicates: number
  warnings: string[]
}
type Property = { name: string; params: string; value: string }
function decode(value: string): string {
  return value.replace(/\\([nN,;\\])/g, (_, c: string) => (c.toLowerCase() === 'n' ? '\n' : c))
}
function parseDate(property: Property): { value: string; allDay: boolean } {
  const raw = property.value
  const match = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/.exec(raw)
  if (!match) throw new Error('Invalid date format')
  const [, y, m, d, h, min, s, z] = match
  const day = y + '-' + m + '-' + d
  if (!validDate(day)) throw new Error('Invalid date')
  if (!h) return { value: day, allDay: true }
  if (!validTime(h + ':' + min) || Number(s) > 59) throw new Error('Invalid time')
  const local = day + 'T' + h + ':' + min + ':' + s
  const tz = /TZID="?([^;"]+)/i.exec(property.params)?.[1]
  if (z) return { value: local + 'Z', allDay: false }
  if (!tz) return { value: new Date(local).toISOString(), allDay: false }
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  })
  const desired = Date.UTC(+y, +m - 1, +d, +h, +min, +s)
  let candidate = desired
  for (let i = 0; i < 4; i++) {
    const parts = Object.fromEntries(
      formatter.formatToParts(candidate).map((part) => [part.type, part.value])
    )
    const represented = Date.UTC(
      +parts.year,
      +parts.month - 1,
      +parts.day,
      +parts.hour,
      +parts.minute,
      +parts.second
    )
    const delta = desired - represented
    if (delta === 0) return { value: new Date(candidate).toISOString(), allDay: false }
    candidate += delta
  }
  throw new Error('Nonexistent or unsupported time-zone transition')
}
export function parseICS(source: string, existing: CalendarEvent[]): ImportResult {
  if (source.length > 5_000_000) throw new Error('Calendar file exceeds 5 MB')
  const lines = source
    .replace(/\r?\n[ \t]/g, '')
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
  if (!lines.includes('BEGIN:VCALENDAR') || !lines.includes('END:VCALENDAR'))
    throw new Error('Invalid calendar file')
  const result: ImportResult = { events: [], duplicates: 0, warnings: [] }
  const keys = new Set(existing.map((event) => event.importKey).filter(Boolean))
  let properties: Property[] | null = null
  let nested = 0
  let count = 0
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      properties = []
      nested = 0
      continue
    }
    if (line === 'END:VEVENT' && properties) {
      count++
      if (count > 5000) throw new Error('Calendar contains more than 5000 events')
      const get = (name: string): Property | undefined => properties!.find((p) => p.name === name)
      const title = decode(get('SUMMARY')?.value || 'Untitled event')
      try {
        if (get('RRULE') || get('RDATE') || get('EXDATE') || get('RECURRENCE-ID'))
          throw new Error('Recurring events are not supported; export individual occurrences')
        if (get('STATUS')?.value === 'CANCELLED') throw new Error('Cancelled event skipped')
        const startProp = get('DTSTART')
        if (!startProp) throw new Error('Missing start date')
        const start = parseDate(startProp)
        let end: string
        if (get('DTEND')) {
          const parsed = parseDate(get('DTEND')!)
          if (parsed.allDay !== start.allDay) throw new Error('Start and end types differ')
          end = parsed.value
        } else if (get('DURATION')) {
          const duration = /^P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(
            get('DURATION')!.value
          )
          if (!duration) throw new Error('Unsupported duration')
          const seconds =
            (+(duration[1] || 0) * 7 + +(duration[2] || 0)) * 86400 +
            +(duration[3] || 0) * 3600 +
            +(duration[4] || 0) * 60 +
            +(duration[5] || 0)
          if (!seconds || (start.allDay && seconds % 86400 !== 0))
            throw new Error('Invalid duration')
          const endDate = new Date(start.allDay ? start.value + 'T00:00:00' : start.value)
          if (start.allDay) endDate.setDate(endDate.getDate() + seconds / 86400)
          else endDate.setTime(endDate.getTime() + seconds * 1000)
          end = start.allDay ? dateKey(endDate) : endDate.toISOString()
        } else if (start.allDay) {
          const next = new Date(start.value + 'T00:00:00')
          next.setDate(next.getDate() + 1)
          end = dateKey(next)
        } else {
          throw new Error('Timed event needs an end or duration')
        }
        if (new Date(end).getTime() <= new Date(start.value).getTime())
          throw new Error('End must follow start')
        const key = get('UID')?.value || [title, start.value, end].join('|')
        if (keys.has(key)) {
          result.duplicates++
          properties = null
          continue
        }
        keys.add(key)
        result.events.push({
          id: crypto.randomUUID(),
          title,
          description: decode(get('DESCRIPTION')?.value || ''),
          start: start.value,
          end,
          allDay: start.allDay,
          color: '#8297f5',
          importKey: key
        })
      } catch (error) {
        result.warnings.push(
          title + ': ' + (error instanceof Error ? error.message : String(error))
        )
      }
      properties = null
      continue
    }
    if (!properties) continue
    if (line.startsWith('BEGIN:')) {
      nested++
      continue
    }
    if (line.startsWith('END:')) {
      nested--
      continue
    }
    if (nested > 0) continue
    const colon = line.indexOf(':')
    if (colon < 0) continue
    const left = line.slice(0, colon)
    const semi = left.indexOf(';')
    properties.push({
      name: (semi < 0 ? left : left.slice(0, semi)).toUpperCase(),
      params: semi < 0 ? '' : left.slice(semi + 1),
      value: line.slice(colon + 1)
    })
  }
  if (properties) throw new Error('Incomplete calendar event')
  return result
}
