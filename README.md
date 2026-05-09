# safeguard-panic (Hack Davis)

Brandon, Evan, and Zak's Hackathon project — SafeGuard panic button web app.

## Development

```bash
npm install
npm run dev
```

## Panic flow

The UI implements press-and-hold audio capture, transcript review, bilingual messaging, and an SMS dispatch step. Transcription (Whisper), wording (Claude), and SMS (Twilio) are wired through small adapter functions in `src/panic/panicServices.ts` so you can swap in real integrations without rewriting the React state machine.
