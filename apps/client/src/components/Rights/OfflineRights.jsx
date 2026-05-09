import { useState, useEffect } from 'react'
import { getRights } from '../../hooks/useIndexedDB'

const FALLBACK_RIGHTS = [
  'You are not required to open the door without a warrant',
  'Ask to see the warrant before opening',
  'You have the right to remain silent',
  'Do not physically resist',
  'You have the right to speak to a lawyer',
]

export default function OfflineRights() {
  const [rights, setRights] = useState(FALLBACK_RIGHTS)

  useEffect(() => {
    getRights()
      .then((stored) => {
        if (stored) {
          try {
            const parsed = JSON.parse(stored)
            if (Array.isArray(parsed)) setRights(parsed)
          } catch {
            // use fallback
          }
        }
      })
      .catch(() => {})
  }, [])

  return (
    <div style={{
      background: '#161b27',
      border: '1px solid #2e3347',
      borderRadius: 12,
      padding: 16,
      margin: '0 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <i className="ti ti-shield-check" style={{ color: '#e55c3a', fontSize: 18 }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e4ea' }}>Core rights (offline)</span>
      </div>
      {rights.map((r, i) => (
        <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
          <span style={{ color: '#e55c3a', fontSize: 12, fontWeight: 700, minWidth: 16 }}>{i + 1}.</span>
          <span style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.5 }}>{r}</span>
        </div>
      ))}
    </div>
  )
}
