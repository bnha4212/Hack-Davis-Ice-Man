import { API_ROUTES, SERVER_URL } from '@iceman/shared'

/**
 * Panic pipeline adapters — swap implementations without changing the UI.
 *
 * --------------------------------------------------------------------------
 * Whisper — speech-to-text
 * --------------------------------------------------------------------------
 * `transcribeAudioOpenAI` POSTs the recording to `backend` `/api/panic/transcribe`
 * (OpenAI Whisper via server; never put OPENAI_API_KEY in the client).
 *
 * --------------------------------------------------------------------------
 * TODO — Claude (or other LLM)
 * --------------------------------------------------------------------------
 * Replace `mockComposeBilingualResponse`:
 * - Send `transcript` + safety/system prompts to Anthropic Messages API (server-side).
 * - Parse structured EN/ES fields from the response (or ask the model for JSON).
 * - Keep copy concise for SMS context.
 *
 * --------------------------------------------------------------------------
 * TODO — Twilio SMS
 * --------------------------------------------------------------------------
 * Replace `mockSendPanicSms`:
 * - From your backend, call Twilio REST API with `TWILIO_ACCOUNT_SID` + auth token
 *   (or API key) — never ship secrets to the client.
 * - Payload should include `transcript` and `message.en` / `message.es` (or your template).
 * - Log message SID / failures for support.
 */

export type BilingualMessage = {
  en: string
  es: string
}

export type PanicSmsPayload = {
  transcript: string
  message: BilingualMessage
}

/** Whisper returns transcript text + detected spoken language (multilingual STT). */
export type TranscriptResult = {
  transcript: string
  /** e.g. `english`, `spanish` — from Whisper `verbose_json`, when available */
  language?: string
}

export type PanicServices = {
  /** Optional ISO 639-1 hint (e.g. `es`, `en`) helps Whisper when you know the spoken language. */
  transcribeAudio: (
    audio: Blob,
    languageHint?: string,
  ) => Promise<TranscriptResult>
  composeBilingualResponse: (transcript: string) => Promise<BilingualMessage>
  sendPanicSms: (payload: PanicSmsPayload) => Promise<void>
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** POST multipart audio to backend → OpenAI Whisper (`whisper-1`, multilingual). */
export async function transcribeAudioOpenAI(
  audio: Blob,
  languageHint?: string,
): Promise<TranscriptResult> {
  const formData = new FormData()
  const filename = audio.type.includes('mp4')
    ? 'recording.mp4'
    : audio.type.includes('webm')
      ? 'recording.webm'
      : 'recording.webm'
  formData.append('audio', audio, filename)
  if (languageHint?.trim()) {
    formData.append('language', languageHint.trim().slice(0, 5))
  }

  const res = await fetch(`${SERVER_URL}${API_ROUTES.PANIC_TRANSCRIBE}`, {
    method: 'POST',
    body: formData,
  })

  const raw = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg =
      typeof raw.error === 'string'
        ? raw.error
        : `Transcription failed (${res.status})`
    throw new Error(msg)
  }

  const transcript = typeof raw.transcript === 'string' ? raw.transcript : ''
  const language =
    typeof raw.language === 'string' ? raw.language : undefined

  return { transcript: transcript.trim(), language }
}

/** Offline / no-backend demo — swap for `transcribeAudioOpenAI` in production. */
export async function mockTranscribeAudio(
  audio: Blob,
  _languageHint?: string,
): Promise<TranscriptResult> {
  await delay(650)
  if (audio.size < 200) {
    return {
      transcript:
        '[Demo] Recording was very short — please hold the button a little longer next time.',
    }
  }
  return {
    transcript:
      '[Demo transcript] I need help. I am in an uncomfortable situation and would like someone to check on me or meet me at my location.',
    language: 'english',
  }
}

/** Demo only — TODO: Claude / LLM (see file header). */
export async function mockComposeBilingualResponse(
  transcript: string,
): Promise<BilingualMessage> {
  await delay(500)
  return {
    en: `Safeguard alert: ${transcript}`,
    es: `Alerta Safeguard: ${transcript}`,
  }
}

/** Demo only — TODO: Twilio via backend (see file header). */
export async function mockSendPanicSms(payload: PanicSmsPayload): Promise<void> {
  await delay(400)
  if (typeof payload.transcript !== 'string' || !payload.message) {
    throw new Error('Invalid SMS payload')
  }
}

/** Default: Whisper via your backend. Use `mockTranscribeAudio` for UI-only demos. */
export const defaultPanicServices: PanicServices = {
  transcribeAudio: transcribeAudioOpenAI,
  composeBilingualResponse: mockComposeBilingualResponse,
  sendPanicSms: mockSendPanicSms,
}
