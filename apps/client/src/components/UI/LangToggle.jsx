export default function LangToggle({ lang, onToggle }) {
  return (
    <div style={{
      display: 'flex',
      background: '#161b27',
      border: '1px solid #2e3347',
      borderRadius: 20,
      padding: 2,
      gap: 2,
    }}>
      {['EN', 'ES'].map((l) => (
        <button
          key={l}
          onClick={() => onToggle(l)}
          style={{
            padding: '4px 12px',
            borderRadius: 16,
            fontSize: 12,
            fontWeight: 600,
            background: lang === l ? '#1e2333' : 'transparent',
            color: lang === l ? '#e2e4ea' : '#5a5f70',
            transition: 'all 0.15s',
          }}
        >
          {l}
        </button>
      ))}
    </div>
  )
}
