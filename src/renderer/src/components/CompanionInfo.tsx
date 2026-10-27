import ForestFairyPet from './ForestFairyPet'
export default function CompanionInfo(): React.JSX.Element {
  return (
    <div className="companion-info">
      <h3>Forest Fairy</h3>
      <p>A gentle little forest spirit who accompanies you while studying.</p>
      <ForestFairyPet size={180} />
    </div>
  )
}
