import { useEffect } from 'react'
import ForestFairyPet from '../components/ForestFairyPet'
export default function PetWindow(): React.JSX.Element {
  useEffect(() => {
    document.documentElement.classList.add('pet-document')
    return () => document.documentElement.classList.remove('pet-document')
  }, [])
  return (
    <div className="desktop-pet-window">
      <button
        className="pet-close"
        title="Close desktop pet"
        aria-label="Close desktop pet"
        onClick={() => void window.petAPI.close()}
      >
        ×
      </button>
      <ForestFairyPet />
      <span className="pet-caption">Forest Fairy</span>
    </div>
  )
}
