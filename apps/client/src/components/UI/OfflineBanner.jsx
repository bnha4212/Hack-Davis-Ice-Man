export default function OfflineBanner({ isOffline }) {
  if (!isOffline) return null
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      background: '#92400e',
      color: '#fef3c7',
      textAlign: 'center',
      fontSize: 13,
      fontWeight: 500,
      padding: '8px 16px',
      zIndex: 200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    }}>
      <i className="ti ti-wifi-off" style={{ fontSize: 16 }} />
      Offline — showing cached data
    </div>
  )
}
