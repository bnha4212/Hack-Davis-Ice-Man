import { useState } from 'react'
import NavBar from '../components/UI/NavBar'
import { useAppDispatch } from '../store'
import { setPins } from '../store/pinsSlice'
import { reset } from '../store/sessionSlice'

function Toggle({ value, onChange, locked }) {
  return (
    <button
      onClick={() => !locked && onChange(!value)}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        background: value ? '#378add' : '#2e3347',
        position: 'relative',
        transition: 'background 0.2s',
        opacity: locked ? 0.5 : 1,
        flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute',
        top: 3,
        left: value ? 22 : 3,
        width: 18,
        height: 18,
        borderRadius: '50%',
        background: '#fff',
        transition: 'left 0.2s',
      }} />
    </button>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: '#5a5f70', letterSpacing: '0.07em', padding: '0 16px', marginBottom: 6 }}>
        {title.toUpperCase()}
      </p>
      <div style={{ background: '#161b27', border: '1px solid #2e3347', borderRadius: 12, overflow: 'hidden', margin: '0 16px' }}>
        {children}
      </div>
    </div>
  )
}

function Row({ label, children, border = true }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '13px 16px',
      borderBottom: border ? '1px solid #1e2333' : 'none',
    }}>
      <span style={{ fontSize: 14, color: '#e2e4ea' }}>{label}</span>
      {children}
    </div>
  )
}

export default function SettingsScreen({ activeScreen, onNavigate }) {
  const dispatch = useAppDispatch()
  const [prefs, setPrefs] = useState({
    lang: 'EN',
    voiceResponse: false,
    showScraped: true,
    radius: '10mi',
    precacheMap: false,
    autoDelete: true,
  })

  const set = (key, val) => setPrefs((p) => ({ ...p, [key]: val }))

  const clearAll = () => {
    localStorage.clear()
    dispatch(setPins([]))
    dispatch(reset())
    if (window.indexedDB) indexedDB.deleteDatabase('warrant')
  }

  const profile = JSON.parse(localStorage.getItem('warrant_profile') || '{"name":"You","city":"Davis, CA"}')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0f1117' }}>
      {/* Header */}
      <div style={{ padding: '52px 16px 16px', background: '#161b27', borderBottom: '1px solid #2e3347' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Settings</h1>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 90, paddingTop: 12 }}>
        {/* Profile row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 16px',
          marginBottom: 20,
        }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: '#1d3a5c',
            color: '#7eb3f5',
            fontSize: 18,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {profile.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>{profile.name}</div>
            <div style={{ fontSize: 13, color: '#9ca3af' }}>{profile.city}</div>
          </div>
        </div>

        <Section title="Preferences">
          <Row label="Default language">
            <div style={{ display: 'flex', gap: 4 }}>
              {['EN', 'ES'].map((l) => (
                <button key={l} onClick={() => set('lang', l)} style={{
                  padding: '4px 10px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  background: prefs.lang === l ? '#1e2333' : 'transparent',
                  color: prefs.lang === l ? '#e2e4ea' : '#5a5f70',
                  border: `1px solid ${prefs.lang === l ? '#2e3347' : 'transparent'}`,
                }}>
                  {l}
                </button>
              ))}
            </div>
          </Row>
          <Row label="Dark mode">
            <Toggle value={true} onChange={() => {}} locked={true} />
          </Row>
          <Row label="Voice response" border={false}>
            <Toggle value={prefs.voiceResponse} onChange={(v) => set('voiceResponse', v)} />
          </Row>
        </Section>

        <Section title="Map">
          <Row label="Show scraped reports">
            <Toggle value={prefs.showScraped} onChange={(v) => set('showScraped', v)} />
          </Row>
          <Row label="Report radius">
            <select
              value={prefs.radius}
              onChange={(e) => set('radius', e.target.value)}
              style={{
                background: '#1e2333',
                border: '1px solid #2e3347',
                borderRadius: 8,
                color: '#e2e4ea',
                fontSize: 13,
                padding: '4px 8px',
                outline: 'none',
              }}
            >
              {['5mi', '10mi', '25mi', '50mi'].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </Row>
          <Row label="Pre-cache map tiles" border={false}>
            <Toggle value={prefs.precacheMap} onChange={(v) => set('precacheMap', v)} />
          </Row>
        </Section>

        <Section title="Privacy">
          <Row label="Anonymous reporting">
            <Toggle value={true} onChange={() => {}} locked={true} />
          </Row>
          <Row label="Auto-delete sessions" border={false}>
            <Toggle value={prefs.autoDelete} onChange={(v) => set('autoDelete', v)} />
          </Row>
        </Section>

        {/* Clear data */}
        <div style={{ padding: '0 16px', marginBottom: 24 }}>
          <button
            onClick={clearAll}
            style={{
              width: '100%',
              background: 'transparent',
              border: '1px solid #e55c3a',
              color: '#e55c3a',
              borderRadius: 12,
              padding: '13px',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Clear all local data
          </button>
        </div>

        {/* Version */}
        <p style={{ textAlign: 'center', fontSize: 12, color: '#5a5f70' }}>
          Warrant v1.0.0 — HackDavis 2026
        </p>
      </div>

      <NavBar activeScreen={activeScreen} onNavigate={onNavigate} />
    </div>
  )
}
