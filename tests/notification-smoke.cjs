const { app, BrowserWindow } = require('electron')
const { resolve } = require('node:path')
const { mkdirSync, writeFileSync } = require('node:fs')
const assert = require('node:assert/strict')
const dir = resolve('.test-data/notification-smoke')
mkdirSync(dir, { recursive: true })
app.setPath('userData', dir)
const now = new Date(),
  dueAt = Math.floor(now.getTime() / 60000) * 60000
const date = [
  now.getFullYear(),
  String(now.getMonth() + 1).padStart(2, '0'),
  String(now.getDate()).padStart(2, '0')
].join('-')
const time =
  String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0')
if (!process.argv.includes('--verify-restart'))
  writeFileSync(
    resolve(dir, 'study-data.json'),
    JSON.stringify({
      schemaVersion: 1,
      classes: [],
      events: [],
      focusHistory: [],
      focusSession: null,
      tasks: [
        {
          id: 'notification-test',
          title: 'Notification verification',
          description: '',
          course: '',
          category: 'homework',
          dueDate: date,
          dueTime: time,
          createdAt: now.toISOString(),
          completed: false
        }
      ],
      reminders: [
        {
          id: ['task', 'notification-test', dueAt, 0].join(':'),
          sourceType: 'task',
          sourceId: 'notification-test',
          title: 'Notification verification',
          dueAt,
          notifyAt: dueAt,
          status: 'pending'
        }
      ],
      settings: {
        pet: 'forest-fairy',
        remindersEnabled: true,
        reminderLeadMinutes: 0,
        focus: { studyMinutes: 25, breakMinutes: 5, rounds: 4 }
      }
    })
  )
require('../out/main/index.js')
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
async function run() {
  await app.whenReady()
  let win
  for (let i = 0; i < 100; i++) {
    win = BrowserWindow.getAllWindows()[0]
    if (win && !win.webContents.isLoading()) break
    await delay(100)
  }
  await delay(1200)
  const snapshot = await win.webContents.executeJavaScript('window.api.snapshot()')
  assert.equal(snapshot.data.reminders[0].status, 'delivered')
  assert.equal(snapshot.warning, null, 'no notification API failure reported')
  console.log(
    'NOTIFICATION_SCHEDULER_PASS supported=' +
      snapshot.notificationSupported +
      ' restart=' +
      process.argv.includes('--verify-restart')
  )
  app.quit()
}
run().catch((e) => {
  console.error(e)
  app.exit(1)
})
