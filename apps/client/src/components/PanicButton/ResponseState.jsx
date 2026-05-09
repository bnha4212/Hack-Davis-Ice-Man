import { SERVER_URL } from '@iceman/shared'

export default function ResponseState({ responseEn, responseEs, lang, contacts, onClose }) {
  const handleSendSMS = async () => {
    try {
      await fetch(SERVER_URL + '/api/panic/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts }),
      })
    } catch {
      // Brandon's endpoint not yet available
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15,17,23,0.97)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 300,
      backdropFilter: 'blur(12px)',
      overflowY: 'auto',
      padding: '24px 16px 100px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Your rights</h2>
        <button onClick={onClose} style={{ color: '#9ca3af', fontSize: 13 }}>
          <i className="ti ti-x" style={{ fontSize: 20 }} />
        </button>
      </div>

      {/* English card */}
      <div style={{
        background: '#161b27',
        border: '1px solid #2e3347',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
      }}>
        <span style={{
          display: 'inline-block',
          background: '#1d3a5c',
          color: '#7eb3f5',
          fontSize: 10,
          fontWeight: 700,
          padding: '2px 8px',
          borderRadius: 10,
          marginBottom: 10,
          letterSpacing: '0.05em',
        }}>English</span>
        <p style={{ fontSize: 14, color: '#e2e4ea', lineHeight: 1.6 }}>{responseEn || '—'}</p>
      </div>

      {/* Spanish card */}
      <div style={{
        background: '#161b27',
        border: '1px solid #2e3347',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
      }}>
        <span style={{
          display: 'inline-block',
          background: '#2d1d5c',
          color: '#a78bfa',
          fontSize: 10,
          fontWeight: 700,
          padding: '2px 8px',
          borderRadius: 10,
          marginBottom: 10,
          letterSpacing: '0.05em',
        }}>Español</span>
        <p style={{ fontSize: 14, color: '#e2e4ea', lineHeight: 1.6 }}>{responseEs || '—'}</p>
      </div>

      {/* Contacts row */}
      {contacts && contacts.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          {contacts.map((c, i) => (
            <span key={i} style={{
              background: '#1e2333',
              border: '1px solid #2e3347',
              borderRadius: 20,
              padding: '4px 12px',
              fontSize: 12,
              color: '#9ca3af',
            }}>
              {c.name}
            </span>
          ))}
        </div>
      )}

      {/* SMS button */}
      <button
        onClick={handleSendSMS}
        style={{
          width: '100%',
          background: '#e55c3a',
          color: '#fff',
          borderRadius: 12,
          padding: '14px',
          fontSize: 15,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <i className="ti ti-message" style={{ fontSize: 18 }} />
        Send SMS Alert
      </button>
    </div>
  )
}
