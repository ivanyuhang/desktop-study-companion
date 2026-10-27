import type { HTMLAttributes } from 'react'
type ForestPanelProps = HTMLAttributes<HTMLElement> & {
  as?: 'section' | 'div'
  variant?: 'parchment' | 'sage'
}
export default function ForestPanel({
  as: Element = 'section',
  variant = 'parchment',
  className = '',
  children,
  ...props
}: ForestPanelProps): React.JSX.Element {
  return (
    <Element {...props} className={`forest-panel forest-panel--${variant} ${className}`.trim()}>
      {children}
    </Element>
  )
}
