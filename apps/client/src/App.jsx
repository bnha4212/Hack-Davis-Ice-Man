import { useState } from 'react'
import HomeScreen from './screens/HomeScreen'
import MapScreen from './screens/MapScreen'
import RightsScreen from './screens/RightsScreen'
import ContactsScreen from './screens/ContactsScreen'
import SettingsScreen from './screens/SettingsScreen'
import { useSocket } from './hooks/useSocket'
import { useOffline } from './hooks/useOffline'

export default function App() {
  const [activeScreen, setActiveScreen] = useState('home')
  useSocket()
  useOffline()

  const screens = {
    home: <HomeScreen activeScreen={activeScreen} onNavigate={setActiveScreen} />,
    map: <MapScreen activeScreen={activeScreen} onNavigate={setActiveScreen} />,
    rights: <RightsScreen activeScreen={activeScreen} onNavigate={setActiveScreen} />,
    contacts: <ContactsScreen activeScreen={activeScreen} onNavigate={setActiveScreen} />,
    settings: <SettingsScreen activeScreen={activeScreen} onNavigate={setActiveScreen} />,
  }

  return (
    <div style={{ width: '100%', height: '100%', background: '#0f1117' }}>
      {screens[activeScreen]}
    </div>
  )
}
