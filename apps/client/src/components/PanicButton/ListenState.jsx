export default function ListenState({ transcript }) {
  const bars = Array.from({ length: 10 }, (_, i) => i)

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15,17,23,0.95)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 24,
      zIndex: 300,
      backdropFilter: 'blur(12px)',
    }}>
      {/* Concentric rings */}
      <div style={{ position: 'relative', width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {[1, 0.6, 0.35].map((opacity, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: 80 + i * 30,
            height: 80 + i * 30,
            borderRadius: '50%',
            border: `2px solid rgba(229,92,58,${opacity})`,
            animation: `ringPulse 1.8s ease-in-out ${i * 0.3}s infinite`,
          }} />
        ))}
        <i className="ti ti-microphone" style={{ fontSize: 36, color: '#e55c3a', zIndex: 1 }} />
      </div>

      {/* Waveform bars */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: 48 }}>
        {bars.map((i) => (
          <div key={i} style={{
            width: 4,
            borderRadius: 2,
            background: '#e55c3a',
            animation: `wave 0.8s ease-in-out ${i * 0.08}s infinite alternate`,
          }} />
        ))}
      </div>

      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 18, fontWeight: 600, color: '#e2e4ea' }}>Listening...</p>
        <p style={{ fontSize: 14, color: '#9ca3af', marginTop: 4 }}>Describe your situation</p>
      </div>

      {transcript && (
        <div style={{
          background: '#161b27',
          border: '1px solid #2e3347',
          borderRadius: 12,
          padding: '12px 16px',
          maxWidth: 300,
          fontSize: 13,
          color: '#9ca3af',
          fontStyle: 'italic',
        }}>
          {transcript}
        </div>
      )}

      <style>{`
        @keyframes ringPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 0.7; }
        }
        @keyframes wave {
          from { height: 8px; }
          to { height: 40px; }
        }
      `}</style>
    </div>
  )
}
