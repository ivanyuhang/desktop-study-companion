import { useEffect, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { AppSnapshot, Command } from '../../../shared/models'
import { CompanionContext as Context } from './useCompanion'
export function CompanionProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [snapshot, setSnapshot] = useState<AppSnapshot | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    const unsubscribe = window.api.subscribe((next) => {
      if (active) setSnapshot(next)
    })
    window.api
      .snapshot()
      .then((next) => {
        if (active) setSnapshot(next)
      })
      .catch((reason) => {
        if (active) setError(String(reason))
      })
    return () => {
      active = false
      unsubscribe()
    }
  }, [])
  const dispatch = useCallback(async (command: Command) => {
    setSnapshot(await window.api.dispatch(command))
  }, [])
  if (error)
    return (
      <main className="startup">
        <h1>Unable to load your workspace</h1>
        <p role="alert">{error}</p>
        <button onClick={() => location.reload()}>Retry</button>
      </main>
    )
  if (!snapshot)
    return (
      <main className="startup" role="status">
        Loading your workspace…
      </main>
    )
  return (
    <Context.Provider value={{ snapshot, dispatch }}>
      {snapshot.warning && (
        <div className="app-warning" role="alert">
          {snapshot.warning}
        </div>
      )}
      {children}
    </Context.Provider>
  )
}
