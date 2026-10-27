const { app, BrowserWindow } = require('electron')
const { resolve } = require('node:path')
const { mkdirSync, writeFileSync } = require('node:fs')
const assert = require('node:assert/strict')
const dir = resolve('.test-data/fairy-ui')
mkdirSync(dir, { recursive: true })
app.setPath('userData', dir)
app.commandLine.appendSwitch('disable-gpu')
require('../out/main/index.js')
const delay = (ms) => new Promise((r) => setTimeout(r, ms))
async function verify(wc) {
  await wc.executeJavaScript(
    "Promise.all([...document.querySelectorAll('.forest-fairy-pet')].map(img=>img.decode()))"
  )
  assert.ok(
    await wc.executeJavaScript(
      "(()=>{const imgs=[...document.querySelectorAll('.forest-fairy-pet')];return imgs.length>0 && imgs.every(i=>i.complete && i.naturalWidth>0 && i.alt==='Forest Fairy' && getComputedStyle(i).objectFit==='contain')})()"
    )
  )
  assert.equal(
    await wc.executeJavaScript("document.querySelectorAll('.pet-choice, .pet-choices').length"),
    0
  )
}
async function capture(win, name) {
  await delay(500)
  writeFileSync(resolve(dir, name + '.png'), (await win.webContents.capturePage()).toPNG())
}
async function run() {
  await app.whenReady()
  await delay(1500)
  const win = BrowserWindow.getAllWindows()[0]
  const wc = win.webContents
  for (const size of [
    [1100, 780],
    [480, 700]
  ]) {
    win.setSize(...size)
    for (const name of ['Desktop Pet', 'Settings']) {
      await wc.executeJavaScript(
        "document.querySelector('button[aria-label=" + JSON.stringify(name) + "]').click()"
      )
      await delay(400)
      await verify(wc)
      assert.ok(
        await wc.executeJavaScript('document.documentElement.scrollWidth<=innerWidth'),
        'no page overflow'
      )
      await capture(win, name.replaceAll(' ', '') + size[0])
    }
  }
  await wc.executeJavaScript('window.api.pet(true)')
  await delay(900)
  const pet = BrowserWindow.getAllWindows().find((w) => w !== win)
  assert.ok(pet)
  await verify(pet.webContents)
  assert.equal(
    await pet.webContents.executeJavaScript('getComputedStyle(document.body).backgroundColor'),
    'rgba(0, 0, 0, 0)'
  )
  assert.ok(
    await pet.webContents.executeJavaScript(
      "(()=>{const r=document.querySelector('img').getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth})()"
    )
  )
  await capture(pet, 'DesktopWindow')
  console.log('FAIRY_UI_PASS')
  app.exit(0)
}
run().catch((e) => {
  console.error(e)
  app.exit(1)
})
