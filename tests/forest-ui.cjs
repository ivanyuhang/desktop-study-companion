const { app, BrowserWindow } = require('electron')
const { resolve } = require('node:path')
const { writeFileSync } = require('node:fs')
const assert = require('node:assert/strict')
app.setPath('userData', resolve('.test-data/electron-smoke'))
app.commandLine.appendSwitch('disable-gpu')
require('../out/main/index.js')
const delay = (ms) => new Promise((r) => setTimeout(r, ms))
async function run() {
  await app.whenReady()
  await delay(1800)
  const win = BrowserWindow.getAllWindows().find(
    (w) => !w.webContents.getURL().includes('pet=true')
  )
  const wc = win.webContents
  const js = (s) => wc.executeJavaScript(s)
  async function page(name) {
    await js("document.querySelector('button[aria-label=" + JSON.stringify(name) + "]').click()")
    await delay(600)
    assert.equal(
      await js("document.querySelector('button[aria-current=page]').getAttribute('aria-label')"),
      name
    )
  }
  async function capture(name) {
    await delay(500)
    writeFileSync(
      resolve('.test-data/electron-smoke', name + '.png'),
      (await wc.capturePage()).toPNG()
    )
  }
  await page('Timetable')
  await capture('Timetable')
  await page('Focus Timer')
  assert.equal(
    await js("document.querySelector('[role=progressbar]').getAttribute('aria-valuemax')"),
    '100'
  )
  await capture('FocusTimer')
  wc.debugger.attach('1.3')
  await wc.debugger.sendCommand('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
  })
  assert.equal(
    await js("getComputedStyle(document.querySelector('.forest-progress')).transitionDuration"),
    '0s'
  )
  wc.debugger.detach()
  win.setSize(480, 700)
  await page('Tasks & Exams')
  await js("[...document.querySelectorAll('button')].find(b=>b.textContent==='Add task').click()")
  await delay(300)
  assert.ok(
    await js(
      "(()=>{const r=document.querySelector('dialog').getBoundingClientRect(); return r.left>=0 && r.right<=innerWidth && r.top>=0 && r.bottom<=innerHeight})()"
    ),
    'dialog within narrow window'
  )
  await capture('ForestDialogNarrow')
  await js("[...document.querySelectorAll('button')].find(b=>b.textContent==='Cancel').click()")
  await page('Dashboard')
  await capture('ForestDashboardNarrow')
  console.log('FOREST_UI_PASS')
  app.exit(0)
}
run().catch((e) => {
  console.error(e)
  app.exit(1)
})
