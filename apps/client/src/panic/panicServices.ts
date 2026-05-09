/**
 * Boundary types for later integrations:
 * - transcribeAudio → OpenAI Whisper (or similar) from recorded Blob
 * - composeBilingualResponse → Claude (or similar) from transcript
 * - sendPanicSms → Twilio (server-side) with the composed text + context
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

/** Demo stand-in: replace with Whisper API call that posts `audio`. */
export async function mockTranscribeAudio(audio: Blob): Promise<string> {
  await delay(650)
  if (audio.size < 200) {
    return '[Demo] Recording was very short — please hold the button a little longer next time.'
  }
  return '[Demo transcript] I need help. I am in an uncomfortable situation and would like someone to check on me or meet me at my location.'
}

/** Demo stand-in: replace with Claude (or other LLM) using `transcript`. */
export async function mockComposeBilingualResponse(
  transcript: string,
): Promise<BilingualMessage> {
  await delay(500)
  return {
    en: `Safeguard alert: ${transcript}`,
    es: `Alerta Safeguard: ${transcript}`,
  }
}

/** Demo stand-in: replace with Twilio call from your backend (do not use secrets in the browser). */
export async function mockSendPanicSms(payload: PanicSmsPayload): Promise<void> {
  await delay(400)
  if (typeof payload.transcript !== 'string' || !payload.message) {
    throw new Error('Invalid SMS payload')
  }
}

export const defaultPanicServices: PanicServices = {
  transcribeAudio: mockTranscribeAudio,
  composeBilingualResponse: mockComposeBilingualResponse,
  sendPanicSms: mockSendPanicSms,
}
