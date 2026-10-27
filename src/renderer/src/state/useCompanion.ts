import { createContext, useContext } from 'react'
import type { AppSnapshot, Command } from '../../../shared/models'
export interface ContextValue {
  snapshot: AppSnapshot
  dispatch: (command: Command) => Promise<void>
}
export const CompanionContext = createContext<ContextValue | null>(null)
export function useCompanion(): ContextValue {
  const context = useContext(CompanionContext)
  if (!context) throw new Error('Workspace provider is missing')
  return context
}
