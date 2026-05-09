/**
 * Panic pipeline adapters — swap implementations without changing the UI.
 *
 * --------------------------------------------------------------------------
 * TODO — Whisper (or other STT)
 * --------------------------------------------------------------------------
 * Replace `mockTranscribeAudio`:
 * - POST `audio` (multipart or base64) to your backend or OpenAI `/v1/audio/transcriptions`.
 * - Do not expose API keys in the browser; call from a server you control.
 * - Return the transcript string (and handle errors / timeouts).
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

export type PanicServices = {
  transcribeAudio: (audio: Blob) => Promise<string>
  composeBilingualResponse: (transcript: string) => Promise<BilingualMessage>
  sendPanicSms: (payload: PanicSmsPayload) => Promise<void>
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Demo only — TODO: Whisper / STT (see file header). */
export async function mockTranscribeAudio(audio: Blob): Promise<string> {
  await delay(650)
  if (audio.size < 200) {
    return '[Demo] Recording was very short — please hold the button a little longer next time.'
  }
  return '[Demo transcript] I need help. I am in an uncomfortable situation and would like someone to check on me or meet me at my location.'
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

/** Wire real APIs by replacing these functions — see TODO blocks at top of file. */
export const defaultPanicServices: PanicServices = {
  transcribeAudio: mockTranscribeAudio,
  composeBilingualResponse: mockComposeBilingualResponse,
  sendPanicSms: mockSendPanicSms,
}
