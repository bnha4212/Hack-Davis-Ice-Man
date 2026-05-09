import { useCallback, useEffect, useRef, useState } from 'react'
import {
  defaultPanicServices,
  type PanicServices,
} from './panicServices'
import './PanicFlow.css'

export type PanicPhase =
  | 'idle'
  | 'recording'
  | 'transcribing'
  | 'confirming'
  | 'responding'
  | 'sent'
  | 'error'

const MIN_HOLD_MS = 450
const HOLD_RING_MS = 8000

type Props = {
  services?: PanicServices
}

function pickMimeType(): string {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
  ]
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c)) return c
  }
  return ''
}

export function PanicFlow({ services = defaultPanicServices }: Props) {
  const [phase, setPhase] = useState<PanicPhase>('idle')
  const [transcript, setTranscript] = useState('')
  const [messageEn, setMessageEn] = useState('')
  const [messageEs, setMessageEs] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [recordingMs, setRecordingMs] = useState(0)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const recordStartRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const maxDurationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current)
      maxDurationTimerRef.current = null
    }
  }, [])

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const resetIdle = useCallback(() => {
    clearTimers()
    stopStream()
    recorderRef.current = null
    chunksRef.current = []
    setRecordingMs(0)
    setTranscript('')
    setMessageEn('')
    setMessageEs('')
    setError(null)
    setPhase('idle')
  }, [clearTimers, stopStream])

  const finishRecording = useCallback(async () => {
    const rec = recorderRef.current
    const started = recordStartRef.current
    const elapsed = Date.now() - started

    clearTimers()

    if (!rec || rec.state === 'inactive') {
      stopStream()
      setPhase('idle')
      return
    }

    const done = new Promise<void>((resolve) => {
      rec.onstop = () => resolve()
    })
    rec.stop()
    await done
    stopStream()
    recorderRef.current = null

    if (elapsed < MIN_HOLD_MS) {
      setPhase('idle')
      setRecordingMs(0)
      return
    }

    const mime = rec.mimeType || 'audio/webm'
    const blob = new Blob(chunksRef.current, { type: mime })
    chunksRef.current = []
    setRecordingMs(0)
    setPhase('transcribing')
    setError(null)

    try {
      const text = await services.transcribeAudio(blob)
      setTranscript(text)
      setPhase('confirming')
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : 'Transcription failed. Try again.'
      setError(msg)
      setPhase('error')
    }
  }, [clearTimers, services, stopStream])

  useEffect(() => {
    if (phase !== 'recording') return

    const onPointerEnd = () => {
      void finishRecording()
    }

    document.addEventListener('pointerup', onPointerEnd)
    document.addEventListener('pointercancel', onPointerEnd)
    return () => {
      document.removeEventListener('pointerup', onPointerEnd)
      document.removeEventListener('pointercancel', onPointerEnd)
    }
  }, [phase, finishRecording])

  const startRecording = useCallback(async () => {
    if (phase !== 'idle' && phase !== 'error' && phase !== 'sent') return

    setError(null)
    setMessageEn('')
    setMessageEs('')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mimeType = pickMimeType()
      const options = mimeType ? { mimeType } : undefined
      const rec = new MediaRecorder(stream, options)
      recorderRef.current = rec
      chunksRef.current = []
      rec.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data)
      }
      rec.start(100)
      recordStartRef.current = Date.now()
      setRecordingMs(0)
      setPhase('recording')

      timerRef.current = setInterval(() => {
        setRecordingMs(Date.now() - recordStartRef.current)
      }, 120)

      maxDurationTimerRef.current = setTimeout(() => {
        void finishRecording()
      }, HOLD_RING_MS)
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : 'Microphone permission is required to record.'
      setError(msg)
      setPhase('error')
      stopStream()
    }
  }, [finishRecording, phase, stopStream])

  const onConfirmSend = useCallback(async () => {
    setPhase('responding')
    setError(null)
    try {
      const bilingual = await services.composeBilingualResponse(transcript)
      setMessageEn(bilingual.en)
      setMessageEs(bilingual.es)
      await services.sendPanicSms({
        transcript,
        message: bilingual,
      })
      setPhase('sent')
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : 'Could not complete the alert flow.'
      setError(msg)
      setPhase('error')
    }
  }, [services, transcript])

  const holdDeg = Math.min(360, (recordingMs / HOLD_RING_MS) * 360)

  const stateLabel: Record<PanicPhase, string> = {
    idle: 'Idle — press and hold the button to record',
    recording: 'Recording… release to finish',
    transcribing: 'Transcribing…',
    confirming: 'Confirm transcript and send',
    responding: 'Composing bilingual message and triggering SMS…',
    sent: 'Sent',
    error: 'Error',
  }

  const showHoldButton =
    phase === 'idle' ||
    phase === 'error' ||
    phase === 'sent' ||
    phase === 'recording'

  return (
    <div className="panic">
      <h1 className="panic__title">SafeGuard</h1>
      <p className="panic__hint">
        Press and hold the panic control to capture audio. Release to transcribe,
        confirm the text, then we draft English and Spanish messages and fire
        the SMS step (demo stubs until Whisper, Claude, and Twilio are
        connected).
      </p>

      <p className="panic__state" aria-live="polite">
        {stateLabel[phase]}
        {phase === 'recording' ? ` · ${(recordingMs / 1000).toFixed(1)}s` : ''}
      </p>

      {error && phase === 'error' && (
        <p className="panic__error" role="alert">
          {error}
        </p>
      )}

      {showHoldButton && (
        <button
          type="button"
          className={
            phase === 'recording'
              ? 'panic__hold panic__hold--recording'
              : 'panic__hold'
          }
          aria-pressed={phase === 'recording'}
          onPointerDown={(e) => {
            if (e.button !== 0) return
            void startRecording()
          }}
        >
          {phase === 'recording' && (
            <span
              className="panic__progress"
              style={{ ['--hold-deg' as string]: `${holdDeg}deg` }}
            />
          )}
          {phase === 'recording' ? 'Recording…' : 'Hold to record'}
        </button>
      )}

      {phase === 'confirming' && (
        <section className="panic__panel" aria-labelledby="confirm-heading">
          <h2 id="confirm-heading">Review transcript</h2>
          <textarea
            className="panic__transcript"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            aria-label="Transcript (you can edit before sending)"
          />
          <div className="panic__actions">
            <button
              type="button"
              className="panic__btn panic__btn--ghost"
              onClick={resetIdle}
            >
              Cancel
            </button>
            <button
              type="button"
              className="panic__btn panic__btn--primary"
              onClick={() => void onConfirmSend()}
              disabled={!transcript.trim()}
            >
              Confirm &amp; send
            </button>
          </div>
        </section>
      )}

      {phase === 'sent' && (
        <section className="panic__panel" aria-labelledby="sent-heading">
          <h2 id="sent-heading">Alert dispatched (demo)</h2>
          <p className="panic__hint" style={{ marginBottom: '12px' }}>
            SMS trigger completed using the stub adapter. Plug in your backend +
            Twilio to deliver real messages.
          </p>
          <dl className="panic__bilingual">
            <div>
              <dt>English</dt>
              <dd>{messageEn}</dd>
            </div>
            <div>
              <dt>Español</dt>
              <dd>{messageEs}</dd>
            </div>
          </dl>
          <div className="panic__actions">
            <button
              type="button"
              className="panic__btn panic__btn--primary"
              onClick={resetIdle}
            >
              Done
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
