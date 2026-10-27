import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { defaults, petIds } from '../src/shared/models.ts'
import { validateData } from '../src/shared/validation.ts'
import { JsonStore } from '../src/main/store.ts'

test('Forest Fairy is the only default and legacy IDs cannot be written anew', () => {
  assert.deepEqual(petIds, ['forest-fairy'])
  assert.equal(defaults().settings.pet, 'forest-fairy')
  for (const pet of ['cat', 'fox', 'owl', 'unknown']) {
    const data = defaults()
    data.settings.pet = pet as never
    assert.throws(() => validateData(data), /pet/i)
  }
})
for (const pet of ['cat', 'fox', 'owl']) {
  test('saved ' + pet + ' migrates without losing study data and survives restart', async () => {
    const dir = resolve('.test-data', 'fairy-migration-' + pet)
    await mkdir(dir, { recursive: true })
    const old = defaults()
    old.settings.pet = pet as never
    old.settings.remindersEnabled = false
    old.settings.reminderLeadMinutes = 1440
    old.settings.focus.studyMinutes = 45
    old.tasks.push({
      id: 'keep',
      title: 'Keep my essay',
      description: 'Existing data',
      course: 'History',
      category: 'homework',
      dueDate: '2099-12-01',
      dueTime: '',
      createdAt: '2026-10-27T00:00:00Z',
      completed: false
    })
    await writeFile(resolve(dir, 'study-data.json'), JSON.stringify(old))
    const store = new JsonStore(dir)
    assert.equal(await store.load(), null)
    const expected = structuredClone(old)
    expected.settings.pet = 'forest-fairy' as never
    assert.deepEqual(store.read(), expected)
    await store.transact((data) => {
      data.settings.focus.breakMinutes = 10
    })
    expected.settings.focus.breakMinutes = 10
    assert.deepEqual(JSON.parse(await readFile(resolve(dir, 'study-data.json'), 'utf8')), expected)
    const reopened = new JsonStore(dir)
    assert.equal(await reopened.load(), null)
    assert.deepEqual(reopened.read(), expected)
  })
}
