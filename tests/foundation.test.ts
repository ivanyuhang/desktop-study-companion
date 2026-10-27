import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile, rm, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { defaults } from '../src/shared/models.ts'
import { validateData } from '../src/shared/validation.ts'
import { JsonStore } from '../src/main/store.ts'

test('defaults are valid, malformed settings and duplicate IDs are rejected', () => {
  assert.equal(validateData(defaults()).schemaVersion, 1)
  const bad = defaults()
  bad.settings.focus.studyMinutes = 0
  assert.throws(() => validateData(bad), /study/i)
  const data = defaults()
  const task = {
    id: 'one',
    title: 'Essay',
    description: '',
    course: '',
    category: 'homework',
    dueDate: '2026-02-30',
    dueTime: '',
    createdAt: new Date().toISOString(),
    completed: false
  }
  data.tasks = [task as never]
  assert.throws(() => validateData(data), /date/i)
  task.dueDate = '2026-02-28'
  data.tasks = [task as never, task as never]
  assert.throws(() => validateData(data), /duplicate/i)
})
test('serialized transactions persist across restart without lost updates', async () => {
  const dir = resolve('.test-data', 'store-' + Date.now())
  try {
    const store = new JsonStore(dir)
    await store.load()
    await Promise.all(
      Array.from({ length: 12 }, (_, i) =>
        store.transact((data) => {
          data.tasks.push({
            id: String(i),
            title: 'Task ' + i,
            description: '',
            course: '',
            category: 'quiz',
            dueDate: '2026-12-01',
            dueTime: '',
            createdAt: new Date().toISOString(),
            completed: false
          })
        })
      )
    )
    const reopened = new JsonStore(dir)
    await reopened.load()
    assert.equal(reopened.read().tasks.length, 12)
    assert.equal(
      JSON.parse(await readFile(resolve(dir, 'study-data.json'), 'utf8')).tasks.length,
      12
    )
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
test('corrupt content is preserved before recovery; future schemas are read-only', async () => {
  const dir = resolve('.test-data', 'corrupt-' + Date.now())
  try {
    await mkdir(dir, { recursive: true })
    await writeFile(resolve(dir, 'study-data.json'), '{broken')
    const store = new JsonStore(dir)
    const warning = await store.load()
    assert.match(warning ?? '', /recover/i)
    assert.ok((await readdir(dir)).some((name) => name.includes('corrupt')))
    await writeFile(
      resolve(dir, 'study-data.json'),
      JSON.stringify({ ...defaults(), schemaVersion: 99 })
    )
    const future = new JsonStore(dir)
    await future.load()
    await assert.rejects(
      future.transact(() => {}),
      /newer/i
    )
    assert.equal(
      JSON.parse(await readFile(resolve(dir, 'study-data.json'), 'utf8')).schemaVersion,
      99
    )
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('settings reject invalid pet, lead time and noninteger focus durations', () => {
  const data = defaults()
  data.settings.pet = 'remote' as never
  assert.throws(() => validateData(data), /pet/)
  data.settings.pet = 'forest-fairy'
  data.settings.reminderLeadMinutes = 17
  assert.throws(() => validateData(data), /lead/)
  data.settings.reminderLeadMinutes = 0
  data.settings.focus.studyMinutes = 1.5
  assert.throws(() => validateData(data), /study/)
})
