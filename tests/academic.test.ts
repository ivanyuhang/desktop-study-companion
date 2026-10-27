import { test } from 'node:test'
import assert from 'node:assert/strict'
import { defaults } from '../src/shared/models.ts'
import { applyCommand } from '../src/main/commands.ts'
import { eventOnDate, taskDeadline } from '../src/shared/dates.ts'
import { parseICS } from '../src/shared/ics.ts'
test('overlapping classes are rejected and touching intervals allowed', () => {
  const data = defaults()
  const a = {
    id: 'a',
    course: 'Math',
    day: 0,
    startTime: '09:00',
    endTime: '10:00',
    location: '204',
    teacher: '',
    color: '#8297f5'
  }
  applyCommand(data, { type: 'class.save', value: a })
  assert.throws(
    () =>
      applyCommand(structuredClone(data), {
        type: 'class.save',
        value: { ...a, id: 'b', startTime: '09:30' }
      }),
    /overlap/
  )
  applyCommand(data, {
    type: 'class.save',
    value: { ...a, id: 'c', startTime: '10:00', endTime: '11:00' }
  })
  assert.equal(data.classes.length, 2)
})
test('date-only deadlines are end of local day and all-day end is exclusive', () => {
  const task = { dueDate: '2026-10-26', dueTime: '' } as never
  assert.equal(new Date(taskDeadline(task)).getHours(), 23)
  const event = { start: '2026-10-26', end: '2026-10-28', allDay: true } as never
  assert.equal(eventOnDate(event, '2026-10-27'), true)
  assert.equal(eventOnDate(event, '2026-10-28'), false)
})
test('ICS unfolds text, retains exclusive dates, identifies duplicates and reports recurrence', () => {
  const source =
    'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nUID:one\r\nSUMMARY:Biology\\, lab\r\n continuation\r\nDTSTART;VALUE=DATE:20261026\r\nDTEND;VALUE=DATE:20261028\r\nEND:VEVENT\r\nBEGIN:VEVENT\r\nUID:repeat\r\nDTSTART:20261026T090000Z\r\nRRULE:FREQ=WEEKLY\r\nSUMMARY:Weekly\r\nEND:VEVENT\r\nEND:VCALENDAR'
  const result = parseICS(source, [])
  assert.equal(result.events.length, 1)
  assert.equal(result.events[0].title, 'Biology, labcontinuation')
  assert.equal(result.events[0].end, '2026-10-28')
  assert.equal(result.warnings.length, 1)
  assert.equal(parseICS(source, result.events).duplicates, 1)
  assert.throws(() => parseICS('not a calendar', []), /calendar/i)
})
test('ICS invalid dates and unknown zones are reported instead of guessed', () => {
  const result = parseICS(
    'BEGIN:VCALENDAR\nBEGIN:VEVENT\nDTSTART;VALUE=DATE:20260230\nSUMMARY:Bad\nEND:VEVENT\nBEGIN:VEVENT\nDTSTART;TZID=MadeUp/Zone:20261026T120000\nSUMMARY:Zone\nEND:VEVENT\nEND:VCALENDAR',
    []
  )
  assert.equal(result.events.length, 0)
  assert.equal(result.warnings.length, 2)
})

test('ICS timed duration remains exact across a daylight-saving transition', () => {
  const original = process.env.TZ
  process.env.TZ = 'America/New_York'
  try {
    const result = parseICS(
      'BEGIN:VCALENDAR\nBEGIN:VEVENT\nDTSTART:20261101T043000Z\nDURATION:PT3H\nSUMMARY:DST\nEND:VEVENT\nEND:VCALENDAR',
      []
    )
    assert.equal(result.events[0].end, '2026-11-01T07:30:00.000Z')
  } finally {
    if (original === undefined) delete process.env.TZ
    else process.env.TZ = original
  }
})
