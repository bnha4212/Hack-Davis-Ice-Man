import { useEffect, useRef, useState } from 'react'
import { usePanicButton } from '../../hooks/usePanicButton'
import { useAppDispatch, useAppSelector } from '../../store'
import { setStatus, setResponse, setError, reset } from '../../store/sessionSlice'
import { sendPanicAudio } from '../../services/api'
import ListenState from './ListenState'
import ProcessingState from './ProcessingState'
import ResponseState from './ResponseState'

export default function PanicButton({ lang }) {
  const dispatch = useAppDispatch()
  const { status, responseEn, responseEs, transcript } = useAppSelector((s) => s.session)
  const { isListening, audioBlob, onPointerDown, onPointerUp } = usePanicButton()
  const [processingReady, setProcessingReady] = useState(false)
  const pendingResponse = useRef(null)

  const contacts = JSON.parse(localStorage.getItem('iceman_contacts') || '[]')

  useEffect(() => {
    if (!audioBlob) return

    dispatch(setStatus('processing'))
    setProcessingReady(false)
    pendingResponse.current = null

    sendPanicAudio(audioBlob, contacts)
      .then((data) => {
        pendingResponse.current = data
        if (processingReady) {
          dispatch(setResponse(data))
          dispatch(setStatus('response'))
        }
      })
      .catch((err) => {
        dispatch(setError(err.message))
      })
  }, [audioBlob])

  const handleProcessingReady = () => {
    setProcessingReady(true)
    if (pendingResponse.current) {
      dispatch(setResponse(pendingResponse.current))
      dispatch(setStatus('response'))
    }
  }

  const handleClose = () => dispatch(reset())

  return (
    <>
      {status === 'listening' && <ListenState transcript={transcript} />}
      {status === 'processing' && <ProcessingState onMinimumElapsed={handleProcessingReady} />}
      {status === 'response' && (
        <ResponseState
          responseEn={responseEn}
          responseEs={responseEs}
          lang={lang}
          contacts={contacts}
          onClose={handleClose}
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        {/* Outer pulse ring */}
        <div style={{ position: 'relative', width: 88, height: 88, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '2px solid rgba(229,92,58,0.27)',
            animation: isListening ? 'none' : 'panicPulse 2s ease-in-out infinite',
          }} />
          <button
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: isListening ? '#c0392b' : '#e55c3a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 24px rgba(229,92,58,0.4)',
              transition: 'background 0.15s, transform 0.1s',
              transform: isListening ? 'scale(0.94)' : 'scale(1)',
              userSelect: 'none',
              touchAction: 'none',
            }}
          >
            <i className={`ti ${isListening ? 'ti-microphone' : 'ti-microphone'}`} style={{ fontSize: 28, color: '#fff' }} />
          </button>
        </div>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>Hold to speak</span>
      </div>

      <style>{`
        @keyframes panicPulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 0.2; }
        }
      `}</style>
    </>
  )
}
