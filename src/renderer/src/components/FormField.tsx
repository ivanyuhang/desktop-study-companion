import type { ReactNode } from 'react'
export default function FormField({
  label,
  children
}: {
  label: string
  children: ReactNode
}): React.JSX.Element {
  return (
    <label className="form-field">
      <span>{label}</span>
      {children}
    </label>
  )
}
