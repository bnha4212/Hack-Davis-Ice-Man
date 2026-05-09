import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from 'react'
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

  const holdButtonRef = useRef<HTMLButtonElement | null>(null)
  const transcriptRef = useRef<HTMLTextAreaElement | null>(null)
  const holdPointerIdRef = useRef<number | null>(null)
  const sessionRef = useRef(0)
  const inflightRef = useRef(false)
  const stopBeforeStartRef = useRef(false)
  const isRecordingRef = useRef(false)
  const finishMutexRef = useRef(false)
  const confirmSendMutexRef = useRef(false)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const recordStartRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const maxDurationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )

  const releaseHoldPointer = useCallback(() => {
    const btn = holdButtonRef.current
    const pid = holdPointerIdRef.current
    if (btn && pid != null) {
      try {
        if (btn.hasPointerCapture(pid)) btn.releasePointerCapture(pid)
      } catch {
        /* ignore */
      }
    }
    holdPointerIdRef.current = null
  }, [])

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
    sessionRef.current += 1
    inflightRef.current = false
    stopBeforeStartRef.current = false
    isRecordingRef.current = false
    finishMutexRef.current = false
    confirmSendMutexRef.current = false
    releaseHoldPointer()
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
  }, [clearTimers, releaseHoldPointer, stopStream])

  const finishRecording = useCallback(async () => {
    if (finishMutexRef.current) return
    finishMutexRef.current = true
    try {
      const rec = recorderRef.current
      const started = recordStartRef.current
      const elapsed = Date.now() - started

      clearTimers()
      releaseHoldPointer()
      isRecordingRef.current = false

      if (!rec || rec.state === 'inactive') {
        stopStream()
        recorderRef.current = null
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
    } finally {
      finishMutexRef.current = false
    }
  }, [clearTimers, releaseHoldPointer, services, stopStream])

  const beginHoldSession = useCallback(async () => {
    const mySession = sessionRef.current
    stopBeforeStartRef.current = false

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (mySession !== sessionRef.current) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }
      if (stopBeforeStartRef.current) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }

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
      isRecordingRef.current = true
      setPhase('recording')

      timerRef.current = setInterval(() => {
        setRecordingMs(Date.now() - recordStartRef.current)
      }, 120)

      maxDurationTimerRef.current = setTimeout(() => {
        void finishRecording()
      }, HOLD_RING_MS)
    } catch (e) {
      releaseHoldPointer()
      const msg =
        e instanceof Error
          ? e.message
          : 'Microphone permission is required to record.'
      setError(msg)
      setPhase('error')
      stopStream()
    } finally {
      inflightRef.current = false
    }
  }, [finishRecording, releaseHoldPointer, stopStream])

  const onHoldPointerDown = useCallback(
    (e: PointerEvent<HTMLButtonElement>) => {
      if (e.button !== 0) return
      if (inflightRef.current || isRecordingRef.current) return
      if (phase !== 'idle' && phase !== 'error' && phase !== 'sent') return

      inflightRef.current = true
      sessionRef.current += 1
      setError(null)
      setMessageEn('')
      setMessageEs('')

      holdPointerIdRef.current = e.pointerId
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        /* capture optional; pointerup on button still fires when finger lifts on control */
      }

      void beginHoldSession()
    },
    [beginHoldSession, phase],
  )

  const onHoldPointerEnd = useCallback(() => {
    if (isRecordingRef.current) {
      void finishRecording()
      return
    }
    if (inflightRef.current) {
      stopBeforeStartRef.current = true
    }
    releaseHoldPointer()
    inflightRef.current = false
  }, [finishRecording, releaseHoldPointer])

  useEffect(() => {
    if (phase !== 'recording') return

    const onWindowPointerEnd = (ev: globalThis.PointerEvent) => {
      const id = holdPointerIdRef.current
      if (id != null && ev.pointerId !== id) return
      onHoldPointerEnd()
    }

    window.addEventListener('pointerup', onWindowPointerEnd, true)
    window.addEventListener('pointercancel', onWindowPointerEnd, true)
    return () => {
      window.removeEventListener('pointerup', onWindowPointerEnd, true)
      window.removeEventListener('pointercancel', onWindowPointerEnd, true)
    }
  }, [phase, onHoldPointerEnd])

  useEffect(() => {
    if (phase !== 'confirming') return
    const id = window.setTimeout(() => transcriptRef.current?.focus(), 50)
    return () => window.clearTimeout(id)
  }, [phase])

  const onConfirmSend = useCallback(async () => {
    if (confirmSendMutexRef.current) return
    confirmSendMutexRef.current = true
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
    } finally {
      confirmSendMutexRef.current = false
    }
  }, [services, transcript])

  const holdDeg = Math.min(360, (recordingMs / HOLD_RING_MS) * 360)

  const stateTitles: Record<PanicPhase, string> = {
    idle: 'Ready',
    recording: 'Recording',
    transcribing: 'Transcribing',
    confirming: 'Confirm',
    responding: 'Sending alert',
    sent: 'Success',
    error: 'Something went wrong',
  }

  const stateHints: Record<PanicPhase, string> = {
    idle: 'Press and hold the red button to speak. Release when you are done.',
    recording: 'Release your finger or mouse to stop and process the clip.',
    transcribing: 'Turning your audio into text…',
    confirming: 'Review and edit the text, then confirm to send.',
    responding: 'Generating bilingual messages and running the SMS step…',
    sent: 'Your demo alert finished successfully.',
    error: 'Fix the issue below or try again.',
  }

  const showHoldButton =
    phase === 'idle' ||
    phase === 'error' ||
    phase === 'sent' ||
    phase === 'recording'

  return (
    <div
      className="panic"
      role="region"
      aria-labelledby="panic-title"
    >
      <h1 id="panic-title" className="panic__title">
        SafeGuard
      </h1>
      <p id="panic-hold-help" className="panic__lede">
        Demo panic flow: hold to record → transcript → confirm → bilingual
        message → SMS (stub). Replace adapters in{' '}
        <code className="panic__code">panicServices.ts</code> for production.
      </p>

      <div
        className="panic__status"
        role="status"
        aria-live="polite"
        aria-busy={phase === 'transcribing' || phase === 'responding'}
        data-phase={phase}
      >
        <span className="panic__badge">{stateTitles[phase]}</span>
        <p className="panic__status-text">{stateHints[phase]}</p>
        {phase === 'recording' && (
          <p className="panic__timer">
            {(recordingMs / 1000).toFixed(1)}s · max {HOLD_RING_MS / 1000}s
          </p>
        )}
        {(phase === 'transcribing' || phase === 'responding') && (
          <div className="panic__spinner" aria-hidden />
        )}
      </div>

      {phase === 'error' && error && (
        <div className="panic__notice panic__notice--error" role="alert">
          <strong className="panic__notice-title">Error</strong>
          <p className="panic__notice-body">{error}</p>
          <p className="panic__notice-foot">
            Try again clears this session and starts from the beginning.
          </p>
          <button
            type="button"
            className="panic__btn panic__btn--primary"
            onClick={resetIdle}
          >
            Try again
          </button>
        </div>
      )}

      {showHoldButton && (
        <button
          ref={holdButtonRef}
          type="button"
          className={
            phase === 'recording'
              ? 'panic__hold panic__hold--recording'
              : 'panic__hold'
          }
          aria-pressed={phase === 'recording'}
          aria-describedby="panic-hold-help"
          aria-label={
            phase === 'recording'
              ? 'Recording. Release to stop.'
              : 'Hold to record audio'
          }
          onPointerDown={onHoldPointerDown}
          onPointerUp={onHoldPointerEnd}
          onPointerCancel={onHoldPointerEnd}
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

      {phase === 'transcribing' && (
        <section className="panic__panel panic__panel--progress" aria-live="polite">
          <h2 className="panic__panel-title">Transcribing</h2>
          <p className="panic__panel-desc">
            Audio is being converted to text. This step will call{' '}
            <strong>Whisper</strong> (or your STT API) in production — see TODO
            in <code className="panic__code">panicServices.ts</code>.
          </p>
        </section>
      )}

      {phase === 'confirming' && (
        <section className="panic__panel" aria-labelledby="confirm-heading">
          <h2 id="confirm-heading" className="panic__panel-title">
            Confirm transcript
          </h2>
          <p className="panic__panel-desc">
            Edit the text if anything looks wrong, then send the alert.
          </p>
          <div className="panic__field">
            <label className="panic__label" htmlFor="panic-transcript">
              Transcript <span className="panic__label-hint">(editable)</span>
            </label>
            <textarea
              ref={transcriptRef}
              id="panic-transcript"
              className="panic__transcript"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={5}
              autoComplete="off"
              spellCheck
            />
          </div>
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

      {phase === 'responding' && (
        <section className="panic__panel panic__panel--progress" aria-live="polite">
          <h2 className="panic__panel-title">Sending alert</h2>
          <p className="panic__panel-desc">
            Composing bilingual copy (→ <strong>Claude</strong> in production)
            and triggering SMS (→ <strong>Twilio</strong> via your backend).
            TODOs are in <code className="panic__code">panicServices.ts</code>.
          </p>
        </section>
      )}

      {phase === 'sent' && (
        <section
          className="panic__panel panic__panel--success"
          aria-labelledby="sent-heading"
        >
          <h2 id="sent-heading" className="panic__panel-title">
            Alert sent (demo)
          </h2>
          <p className="panic__panel-desc">
            The SMS adapter ran in demo mode. Wire your API + Twilio for real
            delivery.
          </p>
          <div className="panic__bilingual" role="group" aria-label="Bilingual messages">
            <article className="panic__lang-card">
              <h3 className="panic__lang-label">English</h3>
              <p className="panic__lang-body">{messageEn}</p>
            </article>
            <article className="panic__lang-card">
              <h3 className="panic__lang-label">Español</h3>
              <p className="panic__lang-body">{messageEs}</p>
            </article>
          </div>
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
