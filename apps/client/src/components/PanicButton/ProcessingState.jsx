import { useEffect } from 'react'

export default function ProcessingState({ onMinimumElapsed }) {
  useEffect(() => {
    const timer = setTimeout(onMinimumElapsed, 3000)
    return () => clearTimeout(timer)
  }, [onMinimumElapsed])

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
      <div style={{
        width: 56,
        height: 56,
        borderRadius: '50%',
        border: '3px solid #1e2333',
        borderTopColor: '#e55c3a',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ fontSize: 16, color: '#9ca3af' }}>Analyzing your situation...</p>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
