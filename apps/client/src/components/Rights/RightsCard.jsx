export default function RightsCard({ title, items, expanded, onToggle }) {
  return (
    <div style={{
      background: '#161b27',
      border: '1px solid #2e3347',
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 8,
    }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 16px',
          color: '#e2e4ea',
          fontSize: 15,
          fontWeight: 600,
        }}
      >
        {title}
        <i className={`ti ${expanded ? 'ti-chevron-up' : 'ti-chevron-down'}`} style={{ fontSize: 18, color: '#5a5f70', transition: 'transform 0.2s' }} />
      </button>

      <div style={{
        maxHeight: expanded ? 600 : 0,
        overflow: 'hidden',
        transition: 'max-height 0.3s ease',
      }}>
        <div style={{ padding: '0 16px 16px' }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
              <span style={{
                minWidth: 22,
                height: 22,
                borderRadius: '50%',
                background: '#1d3a5c',
                color: '#7eb3f5',
                fontSize: 11,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: 1,
              }}>
                {i + 1}
              </span>
              <span style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.5 }}>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
