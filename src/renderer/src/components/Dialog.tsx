import ForestButton from './forest/ForestButton'
import { useEffect, useRef, useState } from 'react'
import type { ReactNode, FormEvent } from 'react'
export default function Dialog({
  title,
  children,
  onClose,
  onSubmit,
  submitLabel = 'Save'
}: {
  title: string
  children: ReactNode
  onClose: () => void
  onSubmit: () => Promise<void>
  submitLabel?: string
}): React.JSX.Element {
  const ref = useRef<HTMLDialogElement>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    const element = ref.current!
    element.showModal()
    return () => element.close()
  }, [])
  async function submit(event: FormEvent): Promise<void> {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await onSubmit()
      onClose()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
    } finally {
      setBusy(false)
    }
  }
  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby="dialog-title"
      onCancel={(event) => {
        event.preventDefault()
        if (!busy) onClose()
      }}
    >
      <form onSubmit={submit}>
        <h2 id="dialog-title">{title}</h2>
        {children}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <ForestButton type="button" onClick={onClose} disabled={busy}>
            Cancel
          </ForestButton>
          <ForestButton type="submit" variant="primary" disabled={busy}>
            {busy ? 'Saving…' : submitLabel}
          </ForestButton>
        </div>
      </form>
    </dialog>
  )
}
export function ConfirmDialog({
  title,
  onClose,
  onConfirm
}: {
  title: string
  onClose: () => void
  onConfirm: () => Promise<void>
}): React.JSX.Element {
  return (
    <Dialog title={title} onClose={onClose} onSubmit={onConfirm} submitLabel="Delete">
      <p>This cannot be undone. Associated pending reminders will also be removed.</p>
    </Dialog>
  )
}
