import { useState } from 'react'
import Page from '../components/Page'
import ForestFairyPet from '../components/ForestFairyPet'
export default function DesktopPet(): React.JSX.Element {
  const [error, setError] = useState('')
  return (
    <Page title="Desktop Pet" subtitle="A quiet companion for your workspace.">
      <section className="panel pet-preview">
        <ForestFairyPet />
        <h2>Forest Fairy</h2>
        <p>A gentle little forest spirit who accompanies you while studying.</p>
        <div className="toolbar">
          <button
            className="primary"
            onClick={() => void window.api.pet(true).catch((e) => setError(String(e)))}
          >
            Show desktop pet
          </button>
          <button onClick={() => void window.api.pet(false).catch((e) => setError(String(e)))}>
            Hide desktop pet
          </button>
        </div>
        <p className="muted">
          Closing the main window leaves a shown companion running; close the companion to exit
          fully.
        </p>
      </section>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </Page>
  )
}
