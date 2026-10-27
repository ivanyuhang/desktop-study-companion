import type { ReactNode } from 'react'
export default function Page({
  title,
  subtitle,
  actions,
  children
}: {
  title: string
  subtitle: string
  actions?: ReactNode
  children: ReactNode
}): React.JSX.Element {
  return (
    <section className="module-page">
      <header className="page-heading">
        <div>
          <div className="dashboard-eyebrow">
            <span className="eyebrow-dot" />
            YOUR WORKSPACE
          </div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        <div className="page-actions">{actions}</div>
      </header>
      {children}
    </section>
  )
}
export function Empty({ children }: { children: ReactNode }): React.JSX.Element {
  return <p className="empty-state">{children}</p>
}
