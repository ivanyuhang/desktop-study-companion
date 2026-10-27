import { test } from 'node:test'
import assert from 'node:assert/strict'
import { defaults } from '../src/shared/models.ts'
import { focusCommand, advanceFocus } from '../src/shared/focus.ts'
import { reconcileReminders, claimDueReminders } from '../src/shared/reminders.ts'
test('focus pause/resume preserves remainder and restart resets only current period', () => {
  const data = defaults(),
    t = 100000
  focusCommand(
    data,
    { type: 'focus.start', settings: { studyMinutes: 1, breakMinutes: 1, rounds: 2 } },
    t
  )
  focusCommand(data, { type: 'focus.pause' }, t + 20000)
  assert.equal(data.focusSession?.remainingMs, 40000)
  focusCommand(data, { type: 'focus.resume' }, t + 90000)
  assert.equal(data.focusSession?.endsAt, t + 130000)
  focusCommand(data, { type: 'focus.restart' }, t + 100000)
  assert.equal(data.focusSession?.endsAt, t + 160000)
})
test('late ticks record one study period and begin the break now, without invented study history', () => {
  const data = defaults()
  focusCommand(
    data,
    { type: 'focus.start', settings: { studyMinutes: 1, breakMinutes: 1, rounds: 2 } },
    0
  )
  advanceFocus(data, 600000)
  assert.equal(data.focusHistory.length, 1)
  assert.equal(data.focusSession?.phase, 'break')
  assert.equal(data.focusSession?.endsAt, 660000)
  advanceFocus(data, 600000)
  assert.equal(data.focusHistory.length, 1)
  advanceFocus(data, 660000)
  assert.equal(data.focusSession?.round, 2)
  advanceFocus(data, 720000)
  assert.equal(data.focusSession?.state, 'completed')
  assert.equal(data.focusHistory.length, 2)
})
test('reminders are claimed once, rescheduled and invalidated by completion/deletion', () => {
  const data = defaults(),
    now = new Date('2026-10-26T10:00:00').getTime()
  data.tasks.push({
    id: 'a',
    title: 'Exam',
    description: '',
    course: '',
    category: 'exam',
    dueDate: '2026-10-26',
    dueTime: '11:00',
    createdAt: new Date(now).toISOString(),
    completed: false
  })
  reconcileReminders(data, now)
  assert.equal(data.reminders[0].notifyAt, now + 1800000)
  assert.equal(claimDueReminders(data, now + 1800000).length, 1)
  assert.equal(claimDueReminders(data, now + 1800001).length, 0)
  data.tasks[0].dueTime = '12:00'
  reconcileReminders(data, now)
  assert.equal(data.reminders[0].status, 'pending')
  data.tasks[0].completed = true
  reconcileReminders(data, now)
  assert.equal(data.reminders.length, 0)
})
test('stale reminders remain visible as missed and do not burst notifications after restart', () => {
  const data = defaults(),
    now = Date.now()
  data.reminders = [
    {
      id: 'x',
      sourceType: 'task',
      sourceId: 'a',
      title: 'Old',
      dueAt: now - 1000,
      notifyAt: now - 3600000,
      status: 'pending'
    }
  ]
  assert.equal(claimDueReminders(data, now).length, 0)
  assert.equal(data.reminders[0].status, 'missed')
})
