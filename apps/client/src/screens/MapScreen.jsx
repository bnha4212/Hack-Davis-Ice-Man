import { useState } from 'react'
import MapView from '../components/Map/MapView'
import NavBar from '../components/UI/NavBar'
import LiveBadge from '../components/UI/LiveBadge'
import LangToggle from '../components/UI/LangToggle'
import OfflineBanner from '../components/UI/OfflineBanner'
import { useAppSelector } from '../store'
import { useOffline } from '../hooks/useOffline'

export default function MapScreen({ activeScreen, onNavigate }) {
  const [lang, setLang] = useState('EN')
  const { isOffline } = useOffline()
  const { pins, connected } = useAppSelector((s) => s.pins)

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <OfflineBanner isOffline={isOffline} />

      <MapView />

      {/* Top-left: wordmark + live badge */}
      <div style={{
        position: 'absolute',
        top: isOffline ? 44 : 16,
        left: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 10,
      }}>
        <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px', color: '#e2e4ea' }}>
          ICE Activity
        </span>
        <LiveBadge count={pins.length} connected={connected} />
      </div>

      {/* Top-right: lang toggle */}
      <div style={{ position: 'absolute', top: isOffline ? 44 : 16, right: 16, zIndex: 10 }}>
        <LangToggle lang={lang} onToggle={setLang} />
      </div>

      <NavBar activeScreen={activeScreen} onNavigate={onNavigate} />
    </div>
  )
}
