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
        padding: '52px 20px 100px',
      }}>
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px', color: '#e2e4ea' }}>
            ICEMAN
          </div>
          <div style={{ fontSize: 13, color: '#5a5f70', marginTop: 4 }}>
            Know your rights. Stay safe.
          </div>
        </div>

        <PanicFlow />
      </div>

      <NavBar activeScreen={activeScreen} onNavigate={onNavigate} />
    </div>
  )
}
