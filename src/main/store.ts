import { mkdir, readFile, writeFile, rename } from 'node:fs/promises'
import { join } from 'node:path'
import { defaults } from '../shared/models.ts'
import type { AppData } from '../shared/models.ts'
import { validateData } from '../shared/validation.ts'
export class JsonStore {
  private directory: string
  private data = defaults()
  private queue: Promise<unknown> = Promise.resolve()
  private locked = false
  constructor(directory: string) {
    this.directory = directory
  }
  async load(): Promise<string | null> {
    await mkdir(this.directory, { recursive: true })
    const path = join(this.directory, 'study-data.json')
    let raw: string
    try {
      raw = await readFile(path, 'utf8')
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
      throw error
    }
    try {
      const parsed = JSON.parse(raw)
      if (parsed?.schemaVersion > 1) {
        this.locked = true
        return 'This data was created by a newer app version. Changes are disabled.'
      }
      // Only historical persisted IDs migrate; new commands remain strictly validated.
      if (parsed?.schemaVersion === 1 && ['cat', 'fox', 'owl'].includes(parsed?.settings?.pet)) {
        parsed.settings.pet = 'forest-fairy'
      }
      this.data = validateData(parsed)
      return null
    } catch {
      await rename(path, join(this.directory, 'study-data.corrupt-' + Date.now() + '.json'))
      this.data = defaults()
      return 'Recovered with empty data. The unreadable file was preserved in the application data folder.'
    }
  }
  read(): AppData {
    return structuredClone(this.data)
  }
  transact(update: (data: AppData) => void): Promise<AppData> {
    const result = this.queue.then(async () => {
      if (this.locked) throw new Error('Data belongs to a newer version; changes are disabled')
      const next = this.read()
      update(next)
      const checked = validateData(next)
      const file = join(this.directory, 'study-data.json')
      await writeFile(file + '.tmp', JSON.stringify(checked, null, 2), 'utf8')
      await rename(file + '.tmp', file)
      this.data = checked
      return this.read()
    })
    this.queue = result.catch(() => {})
    return result
  }
}
