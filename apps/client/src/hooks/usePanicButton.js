import { useState, useRef, useCallback } from 'react'
import { useAppDispatch } from '../store'
import { setStatus } from '../store/sessionSlice'

export function usePanicButton() {
  const dispatch = useAppDispatch()
  const [isListening, setIsListening] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const startTimeRef = useRef(null)

  const onPointerDown = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      startTimeRef.current = Date.now()

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorderRef.current = recorder
      recorder.start()
      setIsListening(true)
      setAudioBlob(null)
      dispatch(setStatus('listening'))
    } catch {
      // microphone not available
    }
  }, [dispatch])

  const onPointerUp = useCallback(() => {
    const recorder = recorderRef.current
    if (!recorder || recorder.state === 'inactive') return

    const held = Date.now() - startTimeRef.current
    if (held < 500) {
      recorder.stop()
      recorder.stream.getTracks().forEach((t) => t.stop())
      setIsListening(false)
      dispatch(setStatus('idle'))
      return
    }

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      setAudioBlob(blob)
      recorder.stream.getTracks().forEach((t) => t.stop())
    }

    recorder.stop()
    setIsListening(false)
  }, [dispatch])

  return { isListening, audioBlob, onPointerDown, onPointerUp }
}
