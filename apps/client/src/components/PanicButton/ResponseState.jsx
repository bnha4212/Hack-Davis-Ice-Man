export default function ResponseState({ responseEn, responseEs, lang, contacts, onClose }) {
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

      {/* SMS sent confirmation */}
      {contacts && contacts.length > 0 && (
        <div style={{
          background: '#0d2e1a',
          border: '1px solid #1a5c34',
          borderRadius: 12,
          padding: '10px 14px',
          marginBottom: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <i className="ti ti-check" style={{ fontSize: 18, color: '#4ade80', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: '#4ade80' }}>
            SMS alert sent to {contacts.length} contact{contacts.length !== 1 ? 's' : ''}:{' '}
            {contacts.map((c) => c.name).join(', ')}
          </span>
        </div>
      )}

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

      <button
        onClick={onClose}
        style={{
          width: '100%',
          background: '#1e2333',
          color: '#e2e4ea',
          borderRadius: 12,
          padding: '14px',
          fontSize: 15,
          fontWeight: 600,
          border: '1px solid #2e3347',
        }}
      >
        Done
      </button>
    </div>
  )
}
