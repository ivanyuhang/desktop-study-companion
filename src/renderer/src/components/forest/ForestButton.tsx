import type { ButtonHTMLAttributes } from 'react'
type ForestButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'wood' | 'primary' | 'danger'
  size?: 'regular' | 'small' | 'icon'
}
export default function ForestButton({
  variant = 'wood',
  size = 'regular',
  className = '',
  type = 'button',
  ...props
}: ForestButtonProps): React.JSX.Element {
  return (
    <button
      {...props}
      type={type}
      className={`forest-button forest-button--${size} ${variant === 'wood' ? '' : variant} ${className}`.trim()}
    />
  )
}
