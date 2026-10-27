import type { CSSProperties } from 'react'
import fairy from '../assets/pets/forest-fairy.png'

export default function ForestFairyPet({
  size,
  className = ''
}: {
  size?: CSSProperties['width']
  className?: string
}): React.JSX.Element {
  return (
    <img
      className={`pet-character forest-fairy-pet ${className}`.trim()}
      src={fairy}
      alt="Forest Fairy"
      draggable={false}
      style={size === undefined ? undefined : { width: size, height: 'auto' }}
    />
  )
}
