import type { CompanionAPI, PetId } from '../shared/models'
declare global {
  interface Window {
    api: CompanionAPI
    electron: { process: { versions: { electron: string; chrome: string; node: string } } }
    petAPI: {
      snapshot: () => Promise<PetId>
      close: () => Promise<void>
      subscribe: (listener: (pet: PetId) => void) => () => void
    }
  }
}
