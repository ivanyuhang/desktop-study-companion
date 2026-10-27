const { app, BrowserWindow } = require('electron')
const { resolve } = require('node:path')
const { mkdirSync, writeFileSync } = require('node:fs')
const assert = require('node:assert/strict')
const dir = resolve('.test-data/electron-smoke')
mkdirSync(dir, { recursive: true })
app.setPath('userData', dir)
require('../out/main/index.js')
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
async function run() {
  await app.whenReady()
  let win
  for (let n = 0; n < 100; n++) {
    win = BrowserWindow.getAllWindows()[0]
    if (win && !win.webContents.isLoading()) break
    await delay(100)
  }
  assert.ok(win, 'window opens')
  const wc = win.webContents
  const errors = []
  wc.on('console-message', (_e, level, message) => {
    if (level === 3) errors.push(message)
  })
  for (let n = 0; n < 50; n++) {
    if (await wc.executeJavaScript("Boolean(window.api && document.querySelector('.sidebar'))"))
      break
    await delay(100)
  }
  const evalJS = (code) => wc.executeJavaScript(code)
  const snap = await evalJS('window.api.snapshot()')
  assert.equal(snap.data.schemaVersion, 1)
  assert.equal(await evalJS('typeof window.require'), 'undefined')
  assert.equal(await evalJS('typeof window.electron.ipcRenderer'), 'undefined')
  if (process.argv.includes('--verify-restart')) {
    assert.ok(
      snap.data.tasks.some((t) => t.id === 'smoke-task'),
      'task survives actual Electron restart'
    )
    assert.ok(
      snap.data.classes.some((t) => t.id === 'smoke-class'),
      'class survives actual Electron restart'
    )
    assert.ok(
      snap.data.events.some((t) => t.id === 'smoke-event'),
      'event survives actual Electron restart'
    )
  } else {
    const commands = [
      {
        type: 'class.save',
        value: {
          id: 'smoke-class',
          course: 'Smoke Math',
          day: 0,
          startTime: '09:00',
          endTime: '10:00',
          location: '204',
          teacher: '',
          color: '#8297f5'
        }
      },
      {
        type: 'task.save',
        value: {
          id: 'smoke-task',
          title: 'Smoke Assignment',
          description: 'Test',
          course: 'Math',
          category: 'homework',
          dueDate: '2099-12-01',
          dueTime: '12:00',
          createdAt: new Date().toISOString(),
          completed: false
        }
      },
      {
        type: 'event.save',
        value: {
          id: 'smoke-event',
          title: 'Smoke Event',
          description: '',
          start: '2099-12-01',
          end: '2099-12-02',
          allDay: true,
          color: '#8297f5'
        }
      }
    ]
    for (const command of commands)
      await evalJS('window.api.dispatch(' + JSON.stringify(command) + ')')
  }
  for (const page of [
    'Timetable',
    'Tasks & Exams',
    'Calendar',
    'Reminders',
    'Focus Timer',
    'Desktop Pet',
    'Settings',
    'Dashboard'
  ]) {
    await evalJS(
      "document.querySelector('button[aria-label=" + JSON.stringify(page) + "]').click()"
    )
    await delay(80)
    if (process.argv.includes('--screenshots'))
      writeFileSync(
        resolve(dir, page.replace(/[^a-z]/gi, '') + '.png'),
        (await wc.capturePage()).toPNG()
      )
    assert.equal(
      await evalJS(
        "document.querySelector('button[aria-current=page]').getAttribute('aria-label')"
      ),
      page
    )
  }
  await evalJS('document.querySelector(\'button[aria-label="Tasks & Exams"]\').click()')
  await delay(80)
  assert.match(await evalJS('document.body.innerText'), /Smoke Assignment/)
  await evalJS("[...document.querySelectorAll('button')].find(b=>b.textContent==='Edit').click()")
  await delay(80)
  assert.equal(await evalJS("document.querySelector('dialog').open"), true)
  await evalJS("[...document.querySelectorAll('button')].find(b=>b.textContent==='Cancel').click()")
  await delay(80)
  assert.equal(await evalJS("document.querySelector('dialog')"), null)
  assert.equal(errors.length, 0, errors.join('\n'))

  await evalJS('document.querySelector(\'button[aria-label="Focus Timer"]\').click()')
  await delay(80)
  let focusSnapshot = await evalJS('window.api.snapshot()')
  if (!focusSnapshot.data.focusSession || focusSnapshot.data.focusSession.state === 'completed')
    await evalJS(
      "window.api.dispatch({type:'focus.start',settings:{studyMinutes:1,breakMinutes:1,rounds:1}})"
    )
  focusSnapshot = await evalJS('window.api.snapshot()')
  if (focusSnapshot.data.focusSession.state === 'running')
    await evalJS("window.api.dispatch({type:'focus.pause'})")
  assert.equal((await evalJS('window.api.snapshot()')).data.focusSession.state, 'paused')
  await evalJS("window.api.dispatch({type:'focus.resume'})")
  assert.equal((await evalJS('window.api.snapshot()')).data.focusSession.state, 'running')
  await evalJS("window.api.dispatch({type:'focus.restart'})")
  await evalJS("window.api.dispatch({type:'focus.pause'})")
  const taskState = await evalJS('window.api.snapshot()')
  assert.ok(taskState.data.reminders.some((r) => r.sourceId === 'smoke-task'))
  await evalJS(
    "window.api.dispatch({type:'task.save',value:{..." +
      JSON.stringify(taskState.data.tasks.find((t) => t.id === 'smoke-task')) +
      ',completed:true}})'
  )
  assert.ok(
    !(await evalJS('window.api.snapshot()')).data.reminders.some((r) => r.sourceId === 'smoke-task')
  )
  await evalJS(
    "window.api.dispatch({type:'task.save',value:" +
      JSON.stringify(taskState.data.tasks.find((t) => t.id === 'smoke-task')) +
      '})'
  )

  await evalJS(
    "window.api.snapshot().then(async s=>{for(const t of s.data.tasks.filter(t=>t.title.startsWith('UI ')))await window.api.dispatch({type:'task.delete',id:t.id});for(const c of s.data.classes.filter(c=>c.course.startsWith('UI ')))await window.api.dispatch({type:'class.delete',id:c.id});for(const e of s.data.events.filter(e=>e.title.startsWith('UI ')))await window.api.dispatch({type:'event.delete',id:e.id});})"
  )
  const clickText = async (text) => {
    await evalJS(
      "[...(document.querySelector('dialog')||document).querySelectorAll('button')].find(b=>b.textContent.trim()===" +
        JSON.stringify(text) +
        ').click()'
    )
    await delay(100)
  }
  const navigate = async (page) => {
    await evalJS(
      "document.querySelector('button[aria-label=" + JSON.stringify(page) + "]').click()"
    )
    await delay(100)
  }
  const fill = async (selector, value) => {
    await evalJS(
      '(()=>{const input=document.querySelector(' +
        JSON.stringify(selector) +
        ");Object.getOwnPropertyDescriptor(input instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(input," +
        JSON.stringify(value) +
        ");input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));})()"
    )
    await delay(40)
  }
  await navigate('Tasks & Exams')
  await clickText('Add task')
  await fill('dialog input:not([type])', 'UI assignment')
  await fill('dialog input[type=date]', '2099-12-02')
  await clickText('Save')
  let uiTask = (await evalJS('window.api.snapshot()')).data.tasks.find(
    (t) => t.title === 'UI assignment'
  )
  assert.ok(uiTask, 'task form saves')
  await evalJS(
    "[...document.querySelectorAll('.item-row')].find(r=>r.textContent.includes('UI assignment')).querySelector('input[type=checkbox]').click()"
  )
  await delay(100)
  assert.equal(
    (await evalJS('window.api.snapshot()')).data.tasks.find((t) => t.id === uiTask.id).completed,
    true
  )
  await evalJS(
    "[...document.querySelectorAll('.item-row')].find(r=>r.textContent.includes('UI assignment')).querySelector('button').click()"
  )
  await delay(100)
  await fill('dialog input:not([type])', 'UI edited assignment')
  await clickText('Save')
  assert.ok(
    (await evalJS('window.api.snapshot()')).data.tasks.some(
      (t) => t.title === 'UI edited assignment'
    )
  )
  await evalJS(
    "[...document.querySelectorAll('.item-row')].find(r=>r.textContent.includes('UI edited assignment')).querySelector('.danger').click()"
  )
  await delay(100)
  assert.equal(await evalJS("document.querySelector('dialog').open"), true)
  await clickText('Delete')
  assert.ok(!(await evalJS('window.api.snapshot()')).data.tasks.some((t) => t.id === uiTask.id))
  await navigate('Timetable')
  await clickText('Add class')
  await fill('dialog input:not([type])', 'UI class')
  await fill('dialog input[type=time]', '12:00')
  await fill('dialog input[type=time]:nth-of-type(1)', '12:00')
  await evalJS(
    "(()=>{const input=document.querySelectorAll('dialog input[type=time]')[1];Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'13:00');input.dispatchEvent(new Event('input',{bubbles:true}));})()"
  )
  await delay(80)
  await clickText('Save')
  const uiClass = (await evalJS('window.api.snapshot()')).data.classes.find(
    (c) => c.course === 'UI class'
  )
  assert.ok(uiClass, 'class form saves')
  await evalJS(
    "(()=>{const transfer=new DataTransfer();transfer.setData('text/plain'," +
      JSON.stringify(uiClass.id) +
      ");document.querySelector('button[aria-label=\"Add class Tuesday 14:00\"]').dispatchEvent(new DragEvent('drop',{bubbles:true,dataTransfer:transfer}));})()"
  )
  await delay(100)
  const moved = (await evalJS('window.api.snapshot()')).data.classes.find(
    (c) => c.id === uiClass.id
  )
  assert.equal(moved.day, 1)
  assert.equal(moved.startTime, '14:00')
  assert.equal(moved.endTime, '15:00')
  await evalJS("window.api.dispatch({type:'class.delete',id:" + JSON.stringify(uiClass.id) + '})')
  await navigate('Calendar')
  await clickText('Add event')
  await fill('dialog input:not([type])', 'UI event')
  await clickText('Save')
  const uiEvent = (await evalJS('window.api.snapshot()')).data.events.find(
    (e) => e.title === 'UI event'
  )
  assert.ok(uiEvent, 'event form saves')
  await evalJS("window.api.dispatch({type:'event.delete',id:" + JSON.stringify(uiEvent.id) + '})')
  const ics =
    'BEGIN:VCALENDAR\nBEGIN:VEVENT\nUID:ui-import\nSUMMARY:UI Imported\nDTSTART;VALUE=DATE:20991201\nDTEND;VALUE=DATE:20991202\nEND:VEVENT\nEND:VCALENDAR'
  await evalJS(
    '(()=>{const files=new DataTransfer();files.items.add(new File([' +
      JSON.stringify(ics) +
      "],'sample.ics',{type:'text/calendar'}));const input=document.querySelector('input[type=file]');input.files=files.files;input.dispatchEvent(new Event('change',{bubbles:true}));})()"
  )
  await delay(150)
  await clickText('Import 1 events')
  const imported = (await evalJS('window.api.snapshot()')).data.events.find(
    (e) => e.importKey === 'ui-import'
  )
  assert.ok(imported, 'file import saves local copy')
  await evalJS("window.api.dispatch({type:'event.delete',id:" + JSON.stringify(imported.id) + '})')
  await navigate('Dashboard')
  assert.match(await evalJS('document.body.innerText'), /Smoke Assignment/)

  const rollover = new Date(Date.now() + 120000)
  const rolloverDate = [
    rollover.getFullYear(),
    String(rollover.getMonth() + 1).padStart(2, '0'),
    String(rollover.getDate()).padStart(2, '0')
  ].join('-')
  const rolloverTime =
    String(rollover.getHours()).padStart(2, '0') +
    ':' +
    String(rollover.getMinutes()).padStart(2, '0')
  await evalJS(
    'window.api.dispatch(' +
      JSON.stringify({
        type: 'task.save',
        value: {
          id: 'rollover-test',
          title: 'UI rollover',
          description: '',
          course: '',
          category: 'homework',
          dueDate: rolloverDate,
          dueTime: rolloverTime,
          createdAt: new Date().toISOString(),
          completed: false
        }
      }) +
      ')'
  )
  await navigate('Tasks & Exams')
  assert.ok(
    !(
      await evalJS(
        "[...document.querySelectorAll('.item-row')].find(r=>r.textContent.includes('UI rollover')).textContent"
      )
    ).includes('Overdue')
  )
  await evalJS(
    'window.originalNow=Date.now;Date.now=()=>' + (rollover.getTime() + 120000) + ';true'
  )
  await delay(1200)
  assert.match(
    await evalJS(
      "[...document.querySelectorAll('.item-row')].find(r=>r.textContent.includes('UI rollover')).textContent"
    ),
    /Overdue/
  )
  await evalJS('Date.now=window.originalNow;delete window.originalNow')
  await evalJS("window.api.dispatch({type:'task.delete',id:'rollover-test'})")

  win.setSize(480, 700)
  for (const page of [
    'Dashboard',
    'Timetable',
    'Tasks & Exams',
    'Calendar',
    'Reminders',
    'Focus Timer',
    'Desktop Pet',
    'Settings'
  ]) {
    await navigate(page)
    assert.ok(
      await evalJS('document.documentElement.scrollWidth <= window.innerWidth'),
      'no outer overflow at narrow width: ' + page
    )
    assert.ok(
      await evalJS(
        "document.querySelector('.main-content').scrollWidth <= document.querySelector('.main-content').clientWidth"
      ),
      'no main overflow at narrow width: ' + page
    )
  }
  win.setSize(1100, 780)

  const preferences = await evalJS('window.api.snapshot()')
  if (process.argv.includes('--verify-restart'))
    assert.equal(preferences.data.settings.pet, 'forest-fairy')
  await evalJS(
    "window.api.dispatch({type:'settings.save',value:{..." +
      JSON.stringify(preferences.data.settings) +
      ",pet:'forest-fairy'}})"
  )
  await evalJS('window.api.pet(true)')
  let pet
  for (let i = 0; i < 50; i++) {
    pet = BrowserWindow.getAllWindows().find((w) => w !== win)
    if (pet && !pet.webContents.isLoading()) break
    await delay(100)
  }
  assert.ok(pet, 'pet window exists')
  assert.deepEqual(pet.getSize(), [200, 240])
  assert.equal(await pet.webContents.executeJavaScript('typeof window.api'), 'undefined')
  assert.equal(await pet.webContents.executeJavaScript('window.petAPI.snapshot()'), 'forest-fairy')
  await evalJS(
    "window.api.dispatch({type:'settings.save',value:{..." +
      JSON.stringify(preferences.data.settings) +
      ",pet:'forest-fairy'}})"
  )
  await delay(100)
  assert.match(
    await pet.webContents.executeJavaScript("document.querySelector('img').alt"),
    /Forest Fairy/
  )
  await evalJS(
    "window.api.dispatch({type:'settings.save',value:{..." +
      JSON.stringify(preferences.data.settings) +
      ",pet:'forest-fairy'}})"
  )
  await evalJS('window.api.pet(false)')
  assert.equal(BrowserWindow.getAllWindows().length, 1)

  await evalJS('window.api.pet(true)')
  for (let i = 0; i < 50; i++) {
    if (BrowserWindow.getAllWindows().length === 2) break
    await delay(50)
  }
  win.close()
  for (let i = 0; i < 50; i++) {
    if (BrowserWindow.getAllWindows().length === 1) break
    await delay(50)
  }
  assert.equal(BrowserWindow.getAllWindows().length, 1, 'pet remains without a full-size window')
  app.emit('second-instance', {}, [], '')
  await delay(200)
  assert.equal(
    BrowserWindow.getAllWindows().length,
    2,
    'app activation reopens workspace while pet remains'
  )

  console.log(
    'ELECTRON_SMOKE_PASS ' + (process.argv.includes('--verify-restart') ? 'restart' : 'initial')
  )
  app.quit()
}
run().catch((error) => {
  console.error(error)
  app.exit(1)
})
