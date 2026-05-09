export default function LiveBadge({ count, connected }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      background: 'rgba(22,27,39,0.85)',
      borderRadius: 20,
      padding: '5px 10px',
      backdropFilter: 'blur(8px)',
    }}>
      <span style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: connected ? '#22c55e' : '#5a5f70',
        boxShadow: connected ? '0 0 0 0 rgba(34,197,94,0.7)' : 'none',
        animation: connected ? 'pulse 1.8s infinite' : 'none',
        flexShrink: 0,
      }} />
      <span style={{ fontSize: 12, color: '#9ca3af' }}>
        {connected ? `${count} reports live` : 'connecting...'}
      </span>
      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.7); }
          70% { box-shadow: 0 0 0 6px rgba(34,197,94,0); }
          100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
        }
      `}</style>
    </div>
  )
}
