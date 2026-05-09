const tabs = [
  { key: 'map', label: 'Map', icon: 'ti-map-2' },
  { key: 'rights', label: 'Rights', icon: 'ti-shield' },
  { key: 'contacts', label: 'Contacts', icon: 'ti-users' },
  { key: 'settings', label: 'Settings', icon: 'ti-settings' },
]

export default function NavBar({ activeScreen, onNavigate }) {
  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: '#161b27',
      borderTop: '1px solid #2e3347',
      display: 'flex',
      zIndex: 100,
    }}>
      {tabs.map((tab) => {
        const active = activeScreen === tab.key
        return (
          <button
            key={tab.key}
            onClick={() => onNavigate(tab.key)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              padding: '10px 0 14px',
              color: active ? '#7eb3f5' : '#5a5f70',
              fontSize: 10,
              fontWeight: active ? 600 : 400,
              transition: 'color 0.15s',
            }}
          >
            <i className={`ti ${tab.icon}`} style={{ fontSize: 22 }} />
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}
