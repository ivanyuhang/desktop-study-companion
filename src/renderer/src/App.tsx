import AppLayout from './components/AppLayout'
import { CompanionProvider } from './state/CompanionProvider'
import PetWindow from './pages/PetWindow'
export default function App(): React.JSX.Element {
  if (new URLSearchParams(location.search).get('pet') === 'true') return <PetWindow />
  return (
    <CompanionProvider>
      <AppLayout />
    </CompanionProvider>
  )
}
