import { PanicFlow } from '../panic/PanicFlow'
import NavBar from '../components/UI/NavBar'
import OfflineBanner from '../components/UI/OfflineBanner'
import { useOffline } from '../hooks/useOffline'

export default function HomeScreen({ activeScreen, onNavigate }) {
  const { isOffline } = useOffline()

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#0f1117',
      color: '#e2e4ea',
    }}>
      <OfflineBanner isOffline={isOffline} />

      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 20px 100px',
      }}>
        <PanicFlow />
      </div>

      <NavBar activeScreen={activeScreen} onNavigate={onNavigate} />
    </div>
  )
}
